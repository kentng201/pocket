import { QueryBuilder, Operator, OperatorValue, QueryableModel } from '../query-builder/QueryBuilder';
import { ModelKey, ModelStatic, ModelType, ModelValue, NewModelType } from '../definitions/Model';
import { APIAutoConfig } from '../definitions/APIAutoConfig';
import { APIMethod } from '../repo/ApiRepo';
export declare function setDefaultDbName(dbName: string): string;
export declare function setDefaultNeedTimestamp(timestamp: boolean): boolean;
export declare function setDefaultNeedSoftDelete(softDelete: boolean): boolean;
export declare class BaseModel {
    static collectionName?: string;
    static dbName: string;
    static readonlyFields: string[];
    static timestamp?: boolean;
    static softDelete: boolean;
    static multiDatabase: boolean;
    getClass(): typeof BaseModel;
    get cName(): string;
    get dName(): string;
    get multiDatabase(): boolean;
    get needTimestamp(): true;
    get needSoftDelete(): true;
    static apiName?: string;
    static apiResource?: string;
    static apiAuto?: APIAutoConfig;
    get aName(): string | undefined;
    get aResource(): string | undefined;
    get aAuto(): APIAutoConfig | undefined;
    get docId(): string;
    get modelId(): string;
    relationships: {
        [relationshipName: string]: () => QueryBuilder<any>;
    };
    id: string;
    _meta: {
        _id: string;
        _fallback_api_doc: boolean;
        _dirty: {
            [key: string]: boolean;
        };
        _before_dirty: {
            [key: string]: any;
        };
        _update_callbacks?: Function[];
        _rev: string;
        _period?: string;
    };
    _tempPeriod?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
    fill(attributes: Partial<ModelType<this>>): void;
    constructor(attributes?: any);
    replicate(): this;
    setForeignFieldsToDocId(): this;
    setForeignFieldsToModelId(): this;
    /**
     * @deprecated retuen query builder of the model
     * @returns A query builder of that model
     */
    static repo<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T>;
    /**
     * Get the first model in the collection
     * @returns a model or undefined
     */
    static first<T extends BaseModel>(this: ModelStatic<T>): Promise<T | undefined>;
    /**
     * Count all models
     * @returns number of models
     */
    static count<T extends BaseModel>(this: ModelStatic<T>): Promise<number>;
    /**
     * Get all models
     * @returns an array of models
     */
    static all<T extends BaseModel>(this: ModelStatic<T>): Promise<T[]>;
    /**
     * Find a model by primary key
     * @param primaryKey id of the model
     * @returns a model or undefined
     */
    static find<T extends BaseModel>(this: ModelStatic<T>, primaryKey?: string | string): Promise<T | undefined>;
    /**
     * Create a new model
     * @param attributes attributes of the model
     * @param databasePeriod period of the database, format YYYY-MM
     * @returns a new model
     */
    static create<T extends BaseModel>(this: ModelStatic<T>, attributes: NewModelType<T>, databasePeriod?: string): Promise<T>;
    /**
     * Update an existing model
     * @param attributes attributes of the model
     * @returns this
     */
    update(attributes: Partial<ModelType<this>>): Promise<this>;
    /**
     * Save the sub-models of this model
     * @returns this
     */
    saveChildren(): Promise<this>;
    bindRelationships(): this;
    private saveCollectionName;
    /**
     * Save a model into database
     * @returns this
     */
    save(): Promise<this>;
    /**
     * Delete a model from database
     * @returns void
     */
    delete(forceDelete?: boolean): Promise<void | this>;
    /**
     * Remove a field from the model
     * @returns this
     */
    removeField(field: string): Promise<this>;
    static withTrashed<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T>;
    static onlyTrashed<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T>;
    static withoutTrashed<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T>;
    restore(): Promise<this>;
    /**
     * Query for specific database
     * @param dbName database name that return from DatabaseManager.get()
     * @returns Model Query Builder with specific database
     */
    static via<T extends BaseModel>(this: ModelStatic<T>, dbName: string): QueryBuilder<T>;
    /**
     * Query default database defined in the model
     * @returns Model Query Builder
     */
    static query<T extends BaseModel>(this: ModelStatic<T>): QueryBuilder<T>;
    static where<T extends BaseModel>(this: ModelStatic<T>, condition: (query: QueryBuilder<T>) => void): QueryBuilder<T>;
    static where<T extends BaseModel>(this: ModelStatic<T>, queryableModel: Partial<QueryableModel<T>>): QueryBuilder<T>;
    static where<T extends BaseModel, Key extends ModelKey<T>>(this: ModelStatic<T>, field: Key | string, value: OperatorValue<T, Key, '='>): QueryBuilder<T>;
    static where<T extends BaseModel, Key extends ModelKey<T>, O extends Operator>(this: ModelStatic<T>, field: Key | string, operator: O, value: OperatorValue<T, Key, O>): QueryBuilder<T>;
    /**
     * Eager load relationships
     * @param relationships all relationships to load, support dot notation
     * @returns
     */
    static with<T extends BaseModel, K extends string[]>(this: ModelStatic<T>, ...relationships: string[]): QueryBuilder<T>;
    /**
     * Load relationships to current model
     * @param relationships all relationships to load, support dot notation
     * @returns
     */
    load<K extends string[]>(...relationships: string[]): Promise<this>;
    belongsTo<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R>;
    hasOne<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R>;
    hasMany<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string): QueryBuilder<R>;
    belongsToMany<R extends BaseModel, P extends BaseModel>(relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: string, foreignKey?: string): Promise<QueryBuilder<R>>;
    /**
     * Call backend API method for the resource
     * @param apiPath Path name
     * @param params Parameters
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns
     */
    static api<Result, Params extends object>(apiPath: string, params: Params, method?: APIMethod): Promise<Result>;
    /**
     * Call backend API method for the resource with id
     * @param apiPath Path name
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns
     */
    api<Result>(apiPath: string, method?: APIMethod): Promise<this | Result>;
    static beforeSave<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static afterSave<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static beforeCreate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static afterCreate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static beforeUpdate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static afterUpdate<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static beforeDelete<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    static afterDelete<Result, T extends BaseModel>(model: T): Promise<Result | BaseModel>;
    /**
     * Convert model to a plain object
     * @returns javascript object
     */
    toJson(): Partial<ModelType<this>>;
    formatResponse?<Output>(cloneSelf: this): Output;
    toResponse(): any;
    /**
     * Check if the model or attribute is dirty
     * @param attribute can be undefined, if undefined, check if the model is dirty, otherwise check if the attribute is dirty
     * @returns
     */
    isDirty(attribute?: ModelKey<this>): boolean;
    /**
     * Get the value of the attribute before it is dirty
     * @param attribute the attribute that which to check
     * @returns
     */
    getBeforeDirtyValue<Key extends ModelKey<this>>(attribute: Key): ModelValue<this, Key>;
    /**
     * A method to check if this model is not the latest version with the database
     * @returns
     */
    isOutdated(): boolean;
    notifyUpdate(): void;
    /**
     * Trigged when the model is being update in the database
     * @param callback
     */
    onChange(callback: Function): void;
    isJoinField(field: string): boolean;
}
export { BaseModel as Model };
