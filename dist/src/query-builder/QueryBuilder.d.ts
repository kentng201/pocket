/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { ValidDotNotationArray } from '../definitions/DotNotation';
import { ModelKey, ModelType, ModelValue, NewModelType } from '../definitions/Model';
import { RelationshipType } from '../definitions/RelationshipType';
import { APIResourceInfo } from '../manager/ApiHostManager';
import { BaseModel } from '../model/Model';
import { ApiRepo } from '../repo/ApiRepo';
declare const operators: readonly ["=", ">", ">=", "<", "<=", "!=", "in", "not in", "between", "like"];
export type Operator = typeof operators[number];
export type OperatorValue<T extends BaseModel, Key extends keyof T, O extends Operator> = O extends 'in' ? ModelValue<T, Key>[] : O extends 'not in' ? ModelValue<T, Key>[] : O extends 'between' ? [ModelValue<T, Key>, ModelValue<T, Key>] : O extends 'like' ? string : ModelValue<T, Key>;
export type QueryableModel<T extends BaseModel> = {
    [Key in ModelKey<T>]: OperatorValue<T, Key, Operator> | [Operator, OperatorValue<T, Key, Operator>];
};
export type QueryBuilderFunction<T extends BaseModel> = (query: QueryBuilder<T>) => void;
export declare function getNewId(): string;
export declare class QueryBuilder<T extends BaseModel, K extends string[] = []> {
    protected queries: PouchDB.Find.FindRequest<T> & {
        selector: {
            $and: PouchDB.Find.Selector[];
        };
    };
    protected sorters?: Array<string | {
        [propName: string]: 'asc' | 'desc';
    }>;
    protected lastWhere?: ModelKey<T> | '$or';
    protected isOne?: boolean;
    protected model: T;
    protected dbName?: string;
    protected relationships?: ValidDotNotationArray<T, K>;
    protected db: PouchDB.Database;
    protected apiInfo?: APIResourceInfo;
    api?: ApiRepo<T>;
    protected relationshipType?: RelationshipType;
    protected localKey?: string;
    protected foreignKey?: string;
    protected softDelete?: 'with' | 'only' | 'none';
    protected isMultiDatabase?: boolean;
    constructor(model: T, relationships?: ValidDotNotationArray<T, K>, dbName?: string, isOne?: boolean, apiInfo?: APIResourceInfo);
    static query<T extends BaseModel, K extends string[] = []>(model: T, relationships?: ValidDotNotationArray<T, K>, dbName?: string): QueryBuilder<T, K>;
    static where<T extends BaseModel, O extends Operator>(field: ModelKey<T> | string, operator: O, value: OperatorValue<T, ModelKey<T>, O>, model: T): QueryBuilder<T, []>;
    raw(): PouchDB.Database;
    setRelationshipType(type: RelationshipType, localKey: string, foreignKey: string): void;
    getRelationshipType(): RelationshipType | undefined;
    getLocalKey(): string | undefined;
    getForeignKey(): string | undefined;
    find(id?: string, forceFind?: boolean): Promise<T | undefined>;
    /**
     * Add eager loading relationships
     * @param relationships relationships to load
     * @returns QueryBuilder
     */
    with(...relationships: string[]): this;
    where(condition: (query: QueryBuilder<T>) => void): this;
    where(queryableModel: Partial<QueryableModel<T>>): this;
    where<Key extends ModelKey<T>>(field: Key | string, value: OperatorValue<T, Key, '='>): this;
    where<Key extends ModelKey<T>, O extends Operator>(field: Key | string, operator: O, value: OperatorValue<T, Key, O>): this;
    orWhere(condition: (query: QueryBuilder<T>) => void): this;
    orWhere(queryableModel: Partial<QueryableModel<T>>): this;
    orWhere<Key extends ModelKey<T>>(field: Key | string, value: OperatorValue<T, Key, '='>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(field: Key | string, operator: Operator, value: OperatorValue<T, Key, O>): this;
    whereCondition(condition: QueryBuilderFunction<T> | Partial<ModelType<T>>, type: '$and' | '$or'): this;
    withTrashed(): this;
    onlyTrashed(): this;
    withoutTrashed(): this;
    orderBy(field: keyof T, order?: 'asc' | 'desc'): this;
    paginate(page: number, limit: number): this;
    getQuery(): PouchDB.Find.FindRequest<T> & {
        selector: {
            $and: PouchDB.Find.Selector[];
        };
    };
    getRelationships(): ValidDotNotationArray<T, K> | undefined;
    private sort;
    private bindRelationship;
    protected cast(item?: ModelType<T>): Promise<T | undefined>;
    private getComparisonValue;
    private checkOrTargetDoc;
    private checkIfTargetDoc;
    private jsSearch;
    private mangoQuery;
    setQueries(queries: PouchDB.Find.FindRequest<{}> & {
        selector: {
            $and: PouchDB.Find.Selector[];
        };
    }): this;
    setIsMultiDatabase(isMultiDatabase: boolean): this;
    protected period?: string;
    setPeriod(period?: string): this;
    get(): Promise<T[]>;
    first(): Promise<T | undefined>;
    last(): Promise<T | undefined>;
    count(): Promise<number>;
    getDoc(id?: string, forceFind?: boolean): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta | undefined>;
    create(attributes: NewModelType<T>, fallbackCreate?: boolean): Promise<PouchDB.Core.Response>;
    update(attributes: Partial<ModelType<T>>): Promise<PouchDB.Core.Response>;
    delete(): Promise<{
        [id: string]: boolean;
    }>;
    deleteOne(id: string): Promise<PouchDB.Core.Response>;
    createIndex(index: PouchDB.Find.CreateIndexOptions): Promise<PouchDB.Find.CreateIndexResponse<{}>>;
}
export {};
