import QueryBuilder, { Operator, OperatorValue, QueryableModel } from 'src/query-builder/QueryBuilder';

// import { belongsTo } from 'src/relationships/BelongsTo';
// import { hasOne } from 'src/relationships/hasOne';
// import { hasMany } from 'src/relationships/HasMany';
// import { belongsToMany } from 'src/relationships/BelongsToMany';

import moment from 'moment';
import pluralize from 'pluralize';
import { ModelKey, ModelStatic, ModelType } from 'src/definitions/Model';

export default class Model {
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
    _id?: string;
    createdAt?: string;
    updatedAt?: string;

    // start of object construction
    public fill(attributes: Partial<ModelType<this>>): void {
        Object.assign(attributes, this);
    }
    constructor(attributes?: any) {
        if (attributes) this.fill(attributes as ModelType<this>);

        // add dirty observer
        this._dirty = {};
        const handler = {
            set: (target: any, key: string, value: any) => {
                // prevent update reserved fields
                const RESERVED_FIELDS = ['_id', 'createdAt', 'updatedAt', 'relationships', '_dirty'];
                if (RESERVED_FIELDS.includes(key)) {
                    throw new Error(`Cannot update reserved field ${key}`);
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
        const item = await (this as unknown as typeof Model).query<T>().where('_id', primaryKey).first();
        if (!item) return undefined;
        return new this(item) as T;
    }
    static async create<T extends Model>(this: ModelStatic<T>, attributes: ModelType<T>): Promise<T> {
        const model = new this(attributes) as T;
        if (model.needTimestamp) {
            attributes.createdAt = moment().toISOString();
            attributes.updatedAt = moment().toISOString();
        }
        delete attributes.relationships;
        delete attributes._dirty;
        // @ts-ignore
        const result = await (this as unknown as typeof Model).query<T>().create(attributes);
        model._id = result._id;
        model.fill(attributes);
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

        // @ts-ignore
        await (this.constructor as typeof Model).query<this>().update(updateAttributes);
        await this.touch();
        return this;
    }
    async save(): Promise<this> {
        const newAttributes: Partial<this> = {};
        // const classHasAttribute = (key: string) => Object.keys(new (this.constructor as typeof Model)()).includes(key)
        for (const field in this) {
            if (typeof field === 'function') continue;
            if (field === '_dirty') continue;
            if (field === 'relationships') continue;
            if (field === 'needTimestamp') continue;
            if (field === 'cName') continue;
            if (field === 'modelName') continue;
            if (this._dirty && !this._dirty[field]) continue;
            // if (!classHasAttribute(field)) {
            //     throw new Error(`Class "${(this.constructor as typeof Model).name}" does not have attribute "${field}" `);
            // }
            newAttributes[field] = this[field];
        }
        const now = moment().toISOString();
        if (this.needTimestamp) newAttributes.updatedAt = now;
        if (!this._id) {
            if (this.needTimestamp) newAttributes.createdAt = now;
            // @ts-ignore
            const result = await (this.constructor as unknown as typeof Model).query<this>().create(newAttributes);
            this.fill(result);
        } else {
            const guarded = (this.constructor as typeof Model).readonlyFields;
            // remove guarded fields
            if (guarded) {
                for (const field of guarded) {
                    delete newAttributes[field as ModelKey<this>];
                }
            }
            // @ts-ignore
            const result = await (this.constructor as typeof Model).query<this>().update(newAttributes);
            this.fill(result);
        }
        await this.touch();
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
        // @ts-ignore
        return (this as unknown as typeof Model).query<T>().where.apply(null, args);
    }
    // end of query builder

    // start of relationship
    // static with<T extends Model>(...relationships: ModelKey<T>[]): QueryBuilder<T> {
    //     const collectionName = this.cName;
    //     const model = new this;
    //     return QueryBuilder.query(model, relationships);
    // }
    // async load(...relationships: ModelKey<this>[]): Promise<this> {
    //     const collectionName = this.cName;
    //     const builder = new QueryBuilder(this, relationships);
    //     const loadedModel = await builder.first() as this;
    //     for (const relationship of relationships) {
    //         this[relationship as keyof this] = loadedModel[relationship] as any;
    //     }
    //     return this;
    // }

    // belongsTo<R extends Model>(relationship: new () => R, localKey?: string, foreignKey?: string): QueryBuilder<R> {
    //     return belongsTo<this, R>(this as any, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    // }
    // hasOne<R extends Model>(relationship: new () => R, localKey?: string, foreignKey?: string): QueryBuilder<R> {
    //     return hasOne<this, R>(this as any, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    // }
    // hasMany<R extends Model>(relationship: new () => R, localKey?: string, foreignKey?: string): QueryBuilder<R> {
    //     return hasMany<this, R>(this as any, relationship, localKey as ModelKey<this>, foreignKey as ModelKey<R>);
    // }
    // async belongsToMany<R extends Model, P extends Model>(relationship: new () => R, pivot: any, localKey?: string, foreignKey?: string): Promise<QueryBuilder<R>> {
    //     return await belongsToMany<this, R, P>(this as any, relationship, pivot, localKey as ModelKey<P>, foreignKey as ModelKey<P>);
    // }
    // end of relationship

    // start transformer for api response 
    formatResponse?(cloneSelf: this): any;
    public toResponse() {
        const replicatedModel: this = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete (replicatedModel as any).save;
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