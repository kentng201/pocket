/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
import { ValidDotNotationArray } from '../definitions/DotNotation';
import { BaseModel, Operator, OperatorValue, QueryableModel, QueryBuilder } from '..';
import { ModelKey, NewModelType } from '../definitions/Model';
export declare class MultiQueryBuilder<T extends BaseModel, K extends string[] = []> {
    protected model: T;
    protected queryBuilder: QueryBuilder<T, K>;
    setQueryBuilder(queryBuilder: QueryBuilder<T, K>): void;
    constructor(model: T, relationships?: ValidDotNotationArray<T, K>);
    static query<T extends BaseModel, K extends string[] = []>(model: T, relationships?: ValidDotNotationArray<T, K>): MultiQueryBuilder<T, K>;
    static where<T extends BaseModel, O extends Operator>(field: ModelKey<T> | string, operator: O, value: OperatorValue<T, ModelKey<T>, O>, model: T): typeof MultiQueryBuilder;
    with(...relationships: string[]): Promise<this>;
    where(condition: (query: QueryBuilder<T>) => void): this;
    where(queryableModel: Partial<QueryableModel<T>>): this;
    where<Key extends ModelKey<T>>(field: Key | string, value: OperatorValue<T, Key, '='>): this;
    where<Key extends ModelKey<T>, O extends Operator>(field: Key | string, operator: O, value: OperatorValue<T, Key, O>): this;
    orWhere(condition: (query: QueryBuilder<T>) => void): this;
    orWhere(queryableModel: Partial<QueryableModel<T>>): this;
    orWhere<Key extends ModelKey<T>>(field: Key | string, value: OperatorValue<T, Key, '='>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(field: Key | string, operator: O, value: OperatorValue<T, Key, O>): this;
    withTrashed(): this;
    onlyTrashed(): this;
    withoutTrashed(): this;
    orderBy(field: keyof T, order?: 'asc' | 'desc'): this;
    protected paginateLimit?: number;
    protected paginateSkip?: number;
    paginate(page: number, limit: number): this;
    getQuery(): PouchDB.Find.FindRequest<T> & {
        selector: {
            $and: PouchDB.Find.Selector[];
        };
    };
    private getDbs;
    private getDbsName;
    get(): Promise<T[]>;
    first(): Promise<T>;
    last(): Promise<T>;
    count(): Promise<number>;
    getDoc(id?: string, forceFind?: boolean): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta | undefined>;
    create(attributes: NewModelType<T>, currentPeriod?: string, fallbackCreate?: boolean): Promise<PouchDB.Core.Response>;
    update(attributes: Partial<T>, period?: string): Promise<PouchDB.Core.Response>;
    delete(): Promise<void>;
    deleteOne(id: string): Promise<void>;
    find(id: string, forceFind?: boolean): Promise<T | undefined>;
    createIndex(index: PouchDB.Find.CreateIndexOptions): Promise<void>;
}
