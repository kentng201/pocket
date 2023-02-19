import { QueryBuilder, Operator, OperatorValue, QueryableModel } from 'src/query-builder/QueryBuilder';
import { Repo } from 'src/repo/Repo';
import { RepoManager } from 'src/manager/RepoManager';

import { belongsTo } from 'src/relationships/BelongsTo';
import { hasOne } from 'src/relationships/hasOne';
import { hasMany } from 'src/relationships/HasMany';
import { belongsToMany } from 'src/relationships/BelongsToMany';

import moment from 'moment';
import pluralize from 'pluralize';
import { ModelKey, ModelStatic, ModelType, NewModelType } from 'src/definitions/Model';
import { isRealTime, addWeakRef } from 'src/real-time/RealTimeModel';
export class Model {
    static collectionName?: string;
    static dbName: string = 'default';
    static readonlyFields?: string[];
    static timestamp?: boolean = true;

    public static get modelName() {
        return (new this).constructor.name;
    }

    public get cName() {
        return (this.constructor as typeof Model).collectionName || pluralize(this.constructor.name, 2);
    }

    public static get cName() {
        return this.collectionName || pluralize((new this()).constructor.name, 2);
    }

    public get dName() {
        return (this.constructor as typeof Model).dbName;
    }

    public static get dName() {
        return this.dbName;
    }

    public get needTimestamp() {
        let timestamp = (this.constructor as typeof Model).timestamp;
        if (timestamp === undefined) {
            timestamp = true;
        }
        return timestamp;
    }

    relationships?: { [relationshipName: string]: () => QueryBuilder<any> };
    public _id: string = '';
    public _rev: string = '';
    public createdAt?: string;
    public updatedAt?: string;

    // start of object construction
    public fill(attributes: Partial<ModelType<this>>): void {
        Object.assign(this, attributes);
    }
    constructor(attributes?: any) {
        if (attributes) this.fill(attributes as ModelType<this>);

        // add dirty observer
        this._dirty = {};
        const handler = {
            set: (target: any, key: string, value: any) => {
                // prevent update reserved fields
                // const RESERVED_FIELDS = ['_id', 'createdAt', 'updatedAt', 'relationships', '_dirty'];
                // if (RESERVED_FIELDS.includes(key) && target[key]) {
                //     throw new Error(`Cannot update reserved field ${key}`);
                // }

                if (key === '_id' && isRealTime) {
                    addWeakRef(value, this);
                }

                if (key === '_dirty') {
                    target[key] = value;
                    return true;
                }
                target[key] = value;
                this._dirty[key] = true;
                return true;
            }
        };
        return new Proxy(this, handler);
    }
    public replicate(): this {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel._id;
        return replicatedModel;
    }
    // end of object construction

    // start of CRUD operation
    static repo<T extends Model>(this: ModelStatic<T>): Repo<T> {
        return RepoManager.get(new this()) as Repo<T>;
    }
    static first<T extends Model>(this: ModelStatic<T>): Promise<T | undefined> {
        // @ts-ignore
        return (this as unknown as typeof Model).query<T>().first();
    }
    static count<T extends Model>(): Promise<number> {
        // @ts-ignore
        return (this as unknown as typeof Model).query<T>().count();
    }
    static async all<T extends Model>(this: ModelStatic<T>): Promise<T[]> {
        // @ts-ignore
        const items = await (this as unknown as typeof Model).query<T>().get();
        const result = [];
        for (const item of items) {
            const castedItem = new this(item) as T;
            result.push(castedItem);
        }
        return result;
    }

    static async find<T extends Model>(primaryKey: string | string): Promise<T | undefined> {
        // @ts-ignore
        const item = await (this as unknown as typeof Model).repo<T>().getDoc(primaryKey);
        if (!item) return undefined;
        return new this(item) as T;
    }
    static async create<T extends Model>(this: ModelStatic<T>, attributes: NewModelType<T>): Promise<T> {
        const model = new this() as T;
        if (model.needTimestamp) {
            attributes.createdAt = moment().toISOString();
            attributes.updatedAt = moment().toISOString();
        }
        model.fill(attributes as ModelType<T>);
        await model.save();
        return model;
    }
    async touch() {
        const id = this._id as string;
        const item = await (this.constructor as typeof Model).find(id) as unknown as Partial<ModelType<this>>;
        this.fill(item);
    }
    async update(attributes: Partial<ModelType<this>>): Promise<this> {
        const guarded = (this.constructor as typeof Model).readonlyFields;
        attributes._id = this._id;
        delete attributes.relationships;
        delete attributes._dirty;
        if (this.needTimestamp) attributes.updatedAt = moment().toISOString();
        let updateAttributes: Partial<ModelType<this>> = {};
        if (this._dirty) {
            updateAttributes = {} as Partial<ModelType<this>>;
            for (const key in this._dirty) {
                if (this._dirty[key] && !guarded?.includes(key)) {
                    updateAttributes[key as keyof ModelType<this>] = attributes[key as keyof ModelType<this>];
                }
            }
        }
        this.fill(updateAttributes);
        await this.save();
        return this;
    }
    async save(): Promise<this> {
        const newAttributes: Partial<this> = {};
        for (const field in this) {
            if (typeof field === 'function') continue;
            if (field === '_dirty') continue;
            if (field === 'relationships') continue;
            if (field === 'needTimestamp') continue;
            if (field === 'cName') continue;
            if (field === 'modelName') continue;
            if (this._dirty && !this._dirty[field]) continue;
            if (this.relationships && Object.keys(this.relationships).includes(field)) continue;
            newAttributes[field] = this[field];
        }
        const now = moment().toISOString();
        let updatedResult;

        let hasDocumentInDb;
        if (!this._id) {
            hasDocumentInDb = false;
        } else {
            // @ts-ignore
            hasDocumentInDb = await (this.constructor as unknown as typeof Model).repo<this>().getDoc(this._id);
        }

        if (this.needTimestamp) newAttributes.updatedAt = now;
        if (!hasDocumentInDb) {
            if (this.needTimestamp) newAttributes.createdAt = now;
            if (this.needTimestamp) newAttributes.updatedAt = now;
            // @ts-ignore
            updatedResult = await (this.constructor as unknown as typeof Model).repo<this>().create(newAttributes);
            this.fill({ _id: updatedResult.id } as Partial<ModelType<this>>);
        } else {
            const guarded = (this.constructor as typeof Model).readonlyFields;
            // remove guarded fields
            if (guarded) {
                for (const field of guarded) {
                    delete newAttributes[field as ModelKey<this>];
                }
            }
            if (this.needTimestamp) newAttributes.updatedAt = now;
            newAttributes._id = this._id;
            // @ts-ignore
            updatedResult = await (this.constructor as typeof Model).repo<this>().update(newAttributes);
            this.fill({ _rev: updatedResult.rev } as Partial<ModelType<this>>);
        }
        this.fill({...newAttributes, _rev: updatedResult.rev} as Partial<ModelType<this>>);
        this._dirty = {};
        return this;
    }
    async delete(): Promise<void> {
        // @ts-ignore
        await (this.constructor as typeof Model).query<this>().where('_id', this._id).delete();
        Object.keys(this).forEach((key) => delete this[key as keyof this]);
    }
    // end of CRUD operation

    // start of query builder
    static query<T extends Model>(this: ModelStatic<T>): QueryBuilder<T> {
        const dbName = (this as unknown as typeof Model).dbName;
        const model = new this;
        return new QueryBuilder(model, undefined, dbName);
    }
    static where<T extends Model>(this: ModelStatic<T>, condition: (query: QueryBuilder<T>) => void): QueryBuilder<T>;
    static where<T extends Model>(this: ModelStatic<T>, queryableModel: Partial<QueryableModel<T>>): QueryBuilder<T>;
    static where<T extends Model, Key extends ModelKey<T>>(this: ModelStatic<T>, field: Key, value: OperatorValue<T, Key, '='>): QueryBuilder<T>;
    static where<T extends Model, Key extends ModelKey<T>, O extends Operator>(this: ModelStatic<T>, field: Key, operator: O, value: OperatorValue<T, Key, O>): QueryBuilder<T>
    static where<T extends Model, Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | O | OperatorValue<T, Key, O>)[]): QueryBuilder<T> {
        const query = new QueryBuilder(new this, undefined, (this as unknown as typeof Model).dbName);
        // @ts-ignore
        return query.where(...args);
    }
    // end of query builder

    // start of relationship
    static with<T extends Model>(this: ModelStatic<T>, ...relationships: ModelKey<T>[]): QueryBuilder<T> {
        const model = new this;
        return new QueryBuilder(model, relationships, (this as unknown as typeof Model).dbName);
    }
    async load(...relationships: ModelKey<this>[]): Promise<this> {
        // @ts-ignore
        const newInstance = new this.constructor() as this;
        const builder = new QueryBuilder(newInstance, relationships, this.dName);
        builder.where('_id', '=', this._id);
        // @ts-ignore
        const loadedModel = await builder.first() as this;
        for (const relationship of relationships) {
            this[relationship as keyof this] = loadedModel[relationship];
        }
        return this;
    }

    belongsTo<R extends Model>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return belongsTo<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    hasOne<R extends Model>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return hasOne<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    hasMany<R extends Model>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R> {
        return hasMany<this, R>(this, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    }
    async belongsToMany<R extends Model, P extends Model>(relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: string, foreignKey?: string): Promise<QueryBuilder<R>> {
        return await belongsToMany<this, R, P>(this, relationship, pivot, localKey as ModelKey<P>, foreignKey as ModelKey<P>);
    }
    // end of relationship

    // start transformer for api response 
    formatResponse?<Output>(cloneSelf: this): Output;
    public toResponse() {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel.save;
        for (const key in replicatedModel) {
            let formattedResult;
            if (Array.isArray(replicatedModel[key]) && (replicatedModel[key] as unknown as Model[])[0] instanceof Model) {
                formattedResult = (replicatedModel[key] as unknown as Model[]).map(m => m.toResponse());
            } else if (replicatedModel[key] instanceof Model) {
                formattedResult = (replicatedModel[key] as unknown as Model).toResponse();
            }
            if (!formattedResult) continue;
            replicatedModel[key] = formattedResult;
        }
        if (this.formatResponse) {
            return this.formatResponse(replicatedModel);
        }
        if (!replicatedModel) throw new Error(`${this.constructor.name}.formatResponse() must return an object`);
        return replicatedModel;
    }
    // end transformer for api response

    // start dirty maintenance
    _dirty: { [key: string]: boolean } = {};

    isDirty(attribute?: ModelKey<this>): boolean {
        if (attribute) return !!this._dirty[attribute as string];
        // return this._dirty whereas the boolean value is true
        return Object.keys(this._dirty).some(key => this._dirty[key]);
    }
    // end dirty maintenance
}