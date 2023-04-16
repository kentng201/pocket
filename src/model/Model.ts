import { QueryBuilder, Operator, OperatorValue, QueryableModel } from 'src/query-builder/QueryBuilder';
import { RepoManager } from 'src/manager/RepoManager';

import { belongsTo } from 'src/relationships/BelongsTo';
import { hasOne } from 'src/relationships/hasOne';
import { hasMany } from 'src/relationships/HasMany';
import { belongsToMany } from 'src/relationships/BelongsToMany';

import moment from 'moment';
import pluralize from 'pluralize';
import { ModelKey, ModelStatic, ModelType, ModelValue, NewModelType } from 'src/definitions/Model';
import { APIAutoConfig } from 'src/definitions/APIAutoConfig';
import { addWeakRef, needToReload } from 'src/real-time/RealTimeModel';
import { APIMethod } from 'src/repo/ApiRepo';
import { ValidDotNotationArray } from 'src/definitions/DotNotation';
import { RelationshipType } from 'src/definitions/RelationshipType';
import { getRelationships } from '..';
import { getModelClass } from './ModelDecorator';

export function setDefaultDbName(dbName: string): string {
    BaseModel.dbName = dbName;
    return BaseModel.dbName;
}
export function setDefaultNeedTimestamp(timestamp: boolean): boolean {
    BaseModel.timestamp = timestamp;
    return BaseModel.timestamp;
}
export function setDefaultNeedRealtimeUpdate(realtimeUpdate: boolean): boolean {
    BaseModel.realtimeUpdate = realtimeUpdate;
    return BaseModel.realtimeUpdate;
}

export class BaseModel {
    static collectionName?: string;
    static dbName: string = 'default';
    static readonlyFields: string[] = [];
    static timestamp?: boolean = true;
    static realtimeUpdate: boolean = true;

    getClass(): typeof BaseModel {
        return this.constructor as typeof BaseModel;
    }

    public get cName() {
        return this.getClass().collectionName || pluralize(this.getClass().name, 2);
    }
    public get dName() {
        return this.getClass().dbName;
    }
    public get rtUpdate() {
        return this.getClass().realtimeUpdate;
    }
    public get needTimestamp() {
        let timestamp = this.getClass().timestamp;
        if (!timestamp) {
            timestamp = true;
        }
        return timestamp;
    }

    // start of API feature
    static apiName?: string;
    static apiResource?: string;
    static apiAuto?: APIAutoConfig;

    public get aName() {
        return this.getClass().apiName;
    }
    public get aResource() {
        return this.getClass().apiResource;
    }
    public get aAuto() {
        return this.getClass().apiAuto;
    }
    public get docId() {
        return this._id?.includes(this.cName + '.') ? this._id : this.cName + '.' + this._id;
    }
    public get modelId() {
        return this._id?.includes(this.cName + '.') ? this._id.replace(this.cName + '.', '') : this._id;
    }
    // end of API feature

    relationships!: { [relationshipName: string]: () => QueryBuilder<any> };
    public _id: string = '';
    public _rev: string = '';
    public _real_time_updating: boolean = false;
    public _fallback_api_doc: boolean = false;
    public createdAt?: string;
    public updatedAt?: string;

    // start of object construction
    public fill(attributes: Partial<ModelType<this>>): void {
        if (attributes._id) attributes._id = attributes._id.replace(this.cName + '.', '');
        Object.assign(this, attributes);
        if (!this.relationships) this.relationships = {};
        this.bindRelationships();
        addWeakRef(this.docId, this);
    }
    constructor(attributes?: object) {
        if (attributes) this.fill(attributes as unknown as ModelType<this>);
        const handler = {
            set: <Key extends ModelKey<this>>(target: this, key: Key, value: ModelValue<this, Key>) => {
                // prevent update reserved fields
                // const RESERVED_FIELDS = ['_id', 'createdAt', 'updatedAt', 'relationships', '_dirty'];
                // if (RESERVED_FIELDS.includes(key) && target[key]) {
                //     throw new Error(`Cannot update reserved field ${key}`);
                // }

                if (!target._dirty) target._dirty = {};
                if (!target._before_dirty) target._before_dirty = {};

                if (key === '_dirty' || key === '_before_dirty' || key === 'relationships') {
                    target[key] = value;
                    return true;
                }
                if (target[key as ModelKey<this>] && target._before_dirty[key as string] === undefined) {
                    target._before_dirty[key as string] = target[key as ModelKey<this>];
                }
                target[key] = value;
                target._dirty[key as string] = true;

                return true;
            },
        };
        return new Proxy(this, handler as ProxyHandler<this>);
    }
    public replicate(): this {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel._id;
        delete replicatedModel._rev;
        return replicatedModel;
    }
    // end of object construction

    // start of foreign key handling
    private updateForeignIdFields<Attributes>(attributes: Attributes): Attributes {
        const relationships = getRelationships(this);
        let fields = Object.keys(relationships).map((key) => {
            if (relationships[key][0] === RelationshipType.BELONGS_TO) {
                const relationshipName = relationships[key][1][0];
                const relationship = getModelClass(relationshipName);
                return {
                    relationship,
                    field: relationships[key][2][1],
                };
            }
            return undefined;
        });
        fields = [...new Set(fields),];
        const idFields = fields.filter((item) => item !== undefined && item.relationship !== undefined) as {
            relationship: ModelStatic<BaseModel>;
            field: string;
        }[];
        for (const idField of idFields) {
            const foreignKeyField = attributes[idField.field as keyof typeof attributes] as string;
            if (!foreignKeyField.includes((new idField.relationship).cName + '.')) {
                attributes[idField.field as keyof typeof attributes] = ((new idField.relationship).cName + '.' + foreignKeyField) as Attributes[keyof Attributes];
            }
        }
        return attributes;
    }
    // end of foreign key handling

    // start of CRUD operation
    /**
     * @deprecated retuen query builder of the model
     * @returns A query builder of that model
     */
    static repo<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T> {
        return RepoManager.get(new this()) as QueryBuilder<T>;
    }
    /**
     * Get the first model in the collection
     * @returns a model or undefined
     */
    static first<T extends BaseModel>(this: ModelStatic<T>): Promise<T | undefined> {
        return new QueryBuilder<T>(new this, undefined, (this as unknown as typeof BaseModel).dbName).first();
    }
    /**
     * Count all models
     * @returns number of models
     */
    static count<T extends BaseModel>(this: ModelStatic<T>): Promise<number> {
        return new QueryBuilder<T>(new this, undefined, (this as unknown as typeof BaseModel).dbName).count();
    }
    /**
     * Get all models
     * @returns an array of models
     */
    static async all<T extends BaseModel>(this: ModelStatic<T>): Promise<T[]> {
        const items = await new QueryBuilder<T>(new this, undefined, (this as unknown as typeof BaseModel).dbName).get();
        const result = [];
        for (const item of items) {
            const castedItem = new this(item) as T;
            result.push(castedItem);
        }
        return result;
    }

    /**
     * Find a model by primary key
     * @param primaryKey _id of the model
     * @returns a model or undefined
     */
    static async find<T extends BaseModel>(this: ModelStatic<T>, primaryKey?: string | string): Promise<T | undefined> {
        if (!primaryKey) return undefined;
        const item = await RepoManager.get(new this()).getDoc(primaryKey);
        if (!item) return undefined;
        return new this(item) as T;
    }
    /**
     * Create a new model
     * @param attributes attributes of the model
     * @returns a new model 
     */
    static async create<T extends BaseModel>(this: ModelStatic<T>, attributes: NewModelType<T>): Promise<T> {
        const model = new this() as T;
        if (model.needTimestamp) {
            attributes.createdAt = moment().toISOString();
            attributes.updatedAt = moment().toISOString();
        }
        attributes = model.updateForeignIdFields(attributes);
        model.fill(attributes as ModelType<T>);
        await model.save();
        return model;
    }
    /**
     * Update an existing model
     * @param attributes attributes of the model
     * @returns this
     */
    async update(attributes: Partial<ModelType<this>>): Promise<this> {
        const guarded = this.getClass().readonlyFields;
        attributes._id = this._id;
        delete attributes.relationships;
        delete attributes._dirty;
        if (this.needTimestamp) attributes.updatedAt = moment().toISOString();
        let updateAttributes: Partial<ModelType<this>> = {};
        updateAttributes = {} as Partial<ModelType<this>>;
        for (const key in attributes) {
            if (!guarded?.includes(key)) {
                updateAttributes[key as keyof ModelType<this>] = attributes[key as keyof ModelType<this>];
            }
        }
        this.fill(updateAttributes);
        await this.save();
        return this;
    }

    /**
     * Save the sub-models of this model
     * @returns this
     */
    async saveChildren(): Promise<this> {
        for (const field in this) {
            if (Array.isArray(this[field]) && (this[field] as BaseModel[])[0] instanceof BaseModel) {
                const query = this.relationships[field]?.();
                if (query?.getRelationshipType() === RelationshipType.HAS_MANY) {
                    const children = this[field] as BaseModel[];
                    const newChildren = [];
                    for (const child of children) {
                        const newChild = new (child.getClass() as ModelStatic<BaseModel>)();
                        const foreignKey = query.getForeignKey() as ModelKey<BaseModel>;
                        child[foreignKey] = this.docId;
                        newChild.fill(child);
                        await newChild.save();
                        newChild._dirty = {};
                        newChildren.push(newChild);
                    }
                    this[field] = newChildren as ModelValue<this, typeof field>;
                }
            } else if (this[field] instanceof BaseModel) {
                const query = this.relationships[field]?.();
                if (query?.getRelationshipType() === RelationshipType.HAS_ONE) {
                    const child = this[field] as BaseModel;
                    const foreignKey = query.getForeignKey() as ModelKey<BaseModel>;
                    if (!child[foreignKey]) {
                        child[foreignKey] = this.docId;
                    }
                    const newChild = new (child.getClass() as ModelStatic<BaseModel>)();
                    newChild.fill(child);
                    await newChild.save();
                    newChild._dirty = {};
                    this[field] = newChild as ModelValue<this, typeof field>;
                }
            }
        }
        return this;
    }

    bindRelationships(): this {
        if (!this.relationships) this.relationships = {};
        const relationships = getRelationships(this);
        Object.keys(relationships).forEach((key) => {
            const relationshipParams = relationships[key];
            const queryBuilder = () => {
                const relationshipName = relationshipParams[1][0];
                const relationship = getModelClass(relationshipName);
                if (relationshipParams[0] === RelationshipType.BELONGS_TO) {
                    return this.belongsTo(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType.HAS_MANY) {
                    return this.hasMany(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType.HAS_ONE) {
                    return this.hasOne(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType.BELONGS_TO_MANY) {
                    const pivotName = relationshipParams[1][1];
                    const pivot = getModelClass(pivotName);
                    return this.belongsToMany(relationship, pivot, relationshipParams[2][0], relationshipParams[2][1]);
                }
                return new QueryBuilder(this);
            };
            this.relationships[key] = queryBuilder as () => QueryBuilder<this, []>;
        });
        return this;
    }

    /**
     * Save a model into database
     * @returns this
     */
    async save(): Promise<this> {
        while (this._real_time_updating) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const newAttributes: Partial<this> = {};
        for (const field in this) {
            if (typeof field === 'function') continue;
            if (field === '_dirty') continue;
            if (field === '_before_dirty') continue;
            if (field === '_real_time_updating') continue;
            if (field === '_fallback_api_doc') continue;
            if (field === 'relationships') continue;
            if (field === 'needTimestamp') continue;
            if (field === 'cName') continue;
            if (this._dirty && !this._dirty[field]) continue;
            if (this.relationships && Object.keys(this.relationships).includes(field)) continue;
            if (typeof this[field] === 'object' && this[field] !== null) {
                let hasFunction = false;
                for (const key in this[field]) {
                    if (typeof this[field][key] === 'function') {
                        hasFunction = true;
                        break;
                    }
                }
                if (hasFunction) continue;
            }
            newAttributes[field] = this[field];
        }
        const now = moment().toISOString();
        let updatedResult;

        let hasDocumentInDb;
        if (!this._id) {
            hasDocumentInDb = false;
        } else {
            hasDocumentInDb = await this.getClass().repo().getDoc(this._id);
        }
        // add static beforeSave function
        if (this.getClass().beforeSave) {
            await this.getClass().beforeSave(this);
        }

        if (this.needTimestamp) newAttributes.updatedAt = now;
        if (!hasDocumentInDb) {
            if (this.needTimestamp) newAttributes.createdAt = now;
            if (this.needTimestamp) newAttributes.updatedAt = now;
            if (this.getClass().beforeCreate) {
                await this.getClass().beforeCreate(this);
            }
            updatedResult = await this.getClass().repo().create(newAttributes);
            this.fill({ _id: updatedResult.id, } as Partial<ModelType<this>>);
            if (this.getClass().afterCreate) {
                await this.getClass().afterCreate(this);
            }
        } else {
            const guarded = this.getClass().readonlyFields;
            if (guarded && guarded.length > 0) {
                for (const field of guarded) {
                    delete newAttributes[field as ModelKey<this>];
                    newAttributes[field as keyof this] = this.getBeforeDirtyValue(field as ModelKey<this>) as ModelValue<this, ModelKey<this>>;
                }
            }
            if (this.needTimestamp) newAttributes.updatedAt = now;
            newAttributes._id = this.cName + '.' + this._id;
            if (this.getClass().beforeUpdate) {
                await this.getClass().beforeUpdate(this);
            }
            updatedResult = await this.getClass().repo().update(newAttributes);
            this.fill({ _rev: updatedResult.rev, } as Partial<ModelType<this>>);
            if (this.getClass().afterCreate) {
                await this.getClass().afterCreate(this);
            }
        }
        this.fill({ ...newAttributes, _rev: updatedResult.rev, } as Partial<ModelType<this>>);
        await this.saveChildren();

        // add static afterSave function
        if (this.getClass().afterSave) {
            await this.getClass().afterSave(this);
        }
        this._id = this.modelId;
        if (!this.relationships) this.relationships = {};
        this._dirty = {};
        this._before_dirty = {};
        return this;
    }
    /**
     * Delete a model from database
     * @returns void
     */
    async delete(): Promise<void> {
        if (this.getClass().beforeDelete) {
            await this.getClass().beforeDelete(this);
        }
        await this.getClass().repo().delete(this._id);
        Object.keys(this).forEach((key) => delete this[key as keyof this]);
        if (this.getClass().afterDelete) {
            await this.getClass().afterDelete(this);
        }
    }
    // end of CRUD operation

    // start of query builder
    static query<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T> {
        return new QueryBuilder<T>(new this, undefined, (this as unknown as typeof BaseModel).dbName);
    }
    static where<T extends BaseModel>(this: ModelStatic<T>, condition: (query: QueryBuilder<T>) => void): QueryBuilder<T>;
    static where<T extends BaseModel>(this: ModelStatic<T>, queryableModel: Partial<QueryableModel<T>>): QueryBuilder<T>;
    static where<T extends BaseModel, Key extends ModelKey<T>>(this: ModelStatic<T>, field: Key, value: OperatorValue<T, Key, '='>): QueryBuilder<T>;
    static where<T extends BaseModel, Key extends ModelKey<T>, O extends Operator>(this: ModelStatic<T>, field: Key, operator: O, value: OperatorValue<T, Key, O>): QueryBuilder<T>;
    static where<T extends BaseModel, Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | O | OperatorValue<T, Key, O>)[]): QueryBuilder<T> {
        const query = new QueryBuilder(new this, undefined, (this as unknown as typeof BaseModel).dbName);
        // @ts-ignore
        return query.where(...args);
    }
    // end of query builder

    // start of relationship
    /**
     * Eager load relationships
     * @param relationships all relationships to load, support dot notation
     * @returns 
     */
    static with<T extends BaseModel, K extends string[]>(this: ModelStatic<T>, ...relationships: string[]): QueryBuilder<T> {
        const model = new this;
        return new QueryBuilder<T, []>(model, relationships as unknown as ValidDotNotationArray<T, []>, (this as unknown as typeof BaseModel).dbName);
    }
    /**
     * Load relationships to current model
     * @param relationships all relationships to load, support dot notation
     * @returns 
     */
    async load<K extends string[]>(...relationships: string[]): Promise<this> {
        const klass = this.getClass();
        const newInstance = new klass() as this;
        const builder = new QueryBuilder(newInstance, relationships, this.dName);
        builder.where('_id', '=', this._id);
        const loadedModel = await builder.first() as this;
        for (const relationship of relationships) {
            this[relationship as keyof this] = loadedModel[relationship as keyof this];
        }
        return this;
    }

    belongsTo<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return belongsTo<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    hasOne<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return hasOne<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    hasMany<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return hasMany<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    async belongsToMany<R extends BaseModel, P extends BaseModel>(relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: string, foreignKey?: string): Promise<QueryBuilder<R>> {
        return await belongsToMany<this, R, P>(this, relationship, pivot, localKey as ModelKey<P>, foreignKey as ModelKey<P>);
    }
    // end of relationship

    // start api method
    /**
     * Call backend API method for the resource
     * @param apiPath Path name
     * @param params Parameters
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns 
     */
    public static api<Result, Params extends object>(apiPath: string, params: Params, method: APIMethod = 'POST'): Promise<Result> {
        return this.repo().api?.callApi(method, apiPath, params) as Promise<Result>;
    }
    /**
     * Call backend API method for the resource with _id
     * @param apiPath Path name
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns 
     */
    public api<Result>(apiPath: string, method: APIMethod = 'POST'): Promise<this | Result> {
        return this.getClass().repo().api?.callModelApi(method, apiPath, this.toJson()) as Promise<this | Result>;
    }
    // end api method

    // start of lifecycle
    public static async beforeSave<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }
    public static async afterSave<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }

    public static async beforeCreate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }
    public static async afterCreate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }

    public static async beforeUpdate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }
    public static async afterUpdate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }

    public static async beforeDelete<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }
    public static async afterDelete<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel> {
        return model;
    }
    // end of lifecycle

    /**
     * Convert model to a plain object
     * @returns javascript object
     */
    public toJson(): Partial<ModelType<this>> {
        const json: Partial<this> = {};
        for (const field in this) {
            if (typeof field === 'function') continue;
            if (field === '_dirty') continue;
            if (field === '_before_dirty') continue;
            if (field === '_real_time_updating') continue;
            if (field === '_fallback_api_doc') continue;
            if (field === 'relationships') continue;
            if (field === 'needTimestamp') continue;
            if (field === 'cName') continue;
            if (this.relationships && Object.keys(this.relationships).includes(field)) continue;
            if (typeof this[field] === 'object' && this[field] !== null) {
                let hasFunction = false;
                for (const key in this[field]) {
                    if (typeof this[field][key] === 'function') {
                        hasFunction = true;
                        break;
                    }
                }
                if (hasFunction) continue;
            }
            json[field as keyof this] = this[field];
        }
        return json;
    }

    // start transformer for api response 
    formatResponse?<Output>(cloneSelf: this): Output;
    public toResponse() {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel.save;
        for (const key in replicatedModel) {
            let formattedResult;
            if (Array.isArray(replicatedModel[key]) && (replicatedModel[key] as unknown as BaseModel[])[0] instanceof BaseModel) {
                formattedResult = (replicatedModel[key] as unknown as BaseModel[]).map(m => m.toResponse());
            } else if (replicatedModel[key] instanceof BaseModel) {
                formattedResult = (replicatedModel[key] as unknown as BaseModel).toResponse();
            }
            if (!formattedResult) continue;
            replicatedModel[key] = formattedResult;
        }
        if (this.formatResponse) {
            return this.formatResponse(replicatedModel);
        }
        if (!replicatedModel) throw new Error(`${this.getClass().name}.formatResponse() must return an object`);
        return replicatedModel;
    }
    // end transformer for api response

    // start dirty maintenance
    _dirty: { [key: string]: boolean } = {};
    _before_dirty: { [key: string]: any } = {};

    /**
     * Check if the model or attribute is dirty
     * @param attribute can be undefined, if undefined, check if the model is dirty, otherwise check if the attribute is dirty
     * @returns 
     */
    isDirty(attribute?: ModelKey<this>): boolean {
        if (attribute) return !!this._dirty[attribute as string];
        // return this._dirty whereas the boolean value is true
        return Object.keys(this._dirty).some(key => this._dirty[key]);
    }
    /**
     * Get the value of the attribute before it is dirty
     * @param attribute the attribute that which to check
     * @returns 
     */
    getBeforeDirtyValue<Key extends ModelKey<this>>(attribute: Key): ModelValue<this, Key> {
        return this._before_dirty[attribute as string];
    }
    /**
     * A method to check if this model is not the latest version with the database
     * @param changeId 
     * @returns 
     */
    isOutdated(changeId: string): boolean {
        return needToReload(this, changeId);
    }
    // end dirty maintenance

    // start of join
    // TODO: add join methods
    isJoinField(field: string): boolean {
        return false;
        // return this._join_fields[field] !== undefined;
    }
    // end of join
}

export { BaseModel as Model };