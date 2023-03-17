import { ModelKey, ModelType, ModelValue } from 'src/definitions/Model';
import { APIResourceInfo } from 'src/manager/ApiHostManager';
import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from 'src/model/Model';
import { ApiRepo } from 'src/repo/ApiRepo';

const operators = ['=', '>', '>=', '<', '<=', '!=', 'in', 'not in', 'between', 'like',] as const;
export type Operator = typeof operators[number];
export type OperatorValue<T extends Model, Key extends keyof T, O extends Operator> =
    O extends 'in' ? ModelValue<T, Key>[]
    : O extends 'not in' ? ModelValue<T, Key>[]
    : O extends 'between' ? [ModelValue<T, Key>, ModelValue<T, Key>]
    : O extends 'like' ? string
    : ModelValue<T, Key>;
export type QueryableModel<T extends Model> = {
    [Key in ModelKey<T>]: OperatorValue<T, Key, Operator> | [Operator, OperatorValue<T, Key, Operator>];
};
export type QueryBuilderFunction<T extends Model> = (query: QueryBuilder<T>) => any;

function toMangoOperator(operator: Operator): string {
    switch (operator) {
        case '=': return '$eq';
        case '!=': return '$ne';
        case '>': return '$gt';
        case '>=': return '$gte';
        case '<': return '$lt';
        case '<=': return '$lte';
        case 'in': return '$in';
        case 'not in': return '$nin';
        case 'between': return '$gte';
        case 'like': return '$regex';
    }
}
function toMangoQuery<T extends Model, Key extends ModelKey<T>, O extends Operator>(field: Key, operator: O, value: OperatorValue<T, Key, O>): PouchDB.Find.Selector {
    if (['=', '!=', '>', '>=', '<', '<=',].includes(operator)) {
        return { [field]: { [toMangoOperator(operator)]: value, }, };
    }
    if (['in', 'not in',].includes(operator)) {
        return { [field]: { [toMangoOperator(operator)]: value, }, };
    }
    if (operator === 'between') {
        const [fromValue, toValue,] = value as [ModelValue<T, Key>, ModelValue<T, Key>];
        return { [field]: { $gte: fromValue, $lte: toValue, }, };
    }
    if (operator === 'like') {
        return { [field]: { $regex: value, }, };
    }

    return {};
}
function queryableValueToValue<T extends Model, Key extends ModelKey<T>, O extends Operator>(field: Key, value: any): PouchDB.Find.Selector {
    if (value instanceof Array && operators.includes(value[0])) {
        return toMangoQuery(field as any, value[0], value[1] as any);
    } else {
        return toMangoQuery(field as any, '=', value as any);
    }
}

export enum RelationshipType {
    HAS_ONE = 'HAS_ONE',
    HAS_MANY = 'HAS_MANY',
    BELONGS_TO = 'BELONGS_TO',
    BELONGS_TO_MANY = 'BELONGS_TO_MANY',
}


export class QueryBuilder<T extends Model> {
    protected queries: PouchDB.Find.FindRequest<T> & { selector: { $and: PouchDB.Find.Selector[] } };

    protected lastWhere?: ModelKey<T> | '$or';
    protected isOne?: boolean;
    protected modelClass: T;
    protected dbName?: string;
    protected relationships: ModelKey<T>[];
    protected db: PouchDB.Database;
    protected apiInfo?: APIResourceInfo;
    protected api?: ApiRepo<T>;

    protected relationshipType?: RelationshipType;

    constructor(modelClass: T, relationships?: ModelKey<T>[], dbName?: string, isOne?: boolean, apiInfo?: APIResourceInfo) {
        if (modelClass.cName === undefined) {
            throw new Error('QueryBuilder create error: collectionName not found');
        }
        this.dbName = dbName;
        this.modelClass = modelClass;
        this.relationships = relationships || [];
        this.queries = { selector: { $and: [], }, };
        this.isOne = isOne;
        this.db = DatabaseManager.get(this.dbName) as PouchDB.Database<T>;
        if (!this.db) throw new Error(`Database ${this.dbName} not found`);
        this.apiInfo = apiInfo;
        if (this.apiInfo) this.api = new ApiRepo<T>(this.apiInfo);
    }

    static query<T extends Model>(modelClass: T, relationships?: ModelKey<T>[], dbName?: string) {
        return new this(modelClass, relationships, dbName, false) as QueryBuilder<T>;
    }

    static where<T extends Model, O extends Operator>(field: ModelKey<T>, operator: O, value: OperatorValue<T, ModelKey<T>, O>, modelClass: T) {
        const builder = this.query<T>(modelClass);
        return builder.where(field, operator, value);
    }

    raw() {
        return {};
    }

    setRelationshipType(type: RelationshipType) {
        this.relationshipType = type;
    }
    getRelationshipType() {
        return this.relationshipType;
    }

    async find(_id: string): Promise<T | undefined> {
        const doc = await this.db.get(_id);
        return this.cast(doc as ModelType<T>);
    }

    where(condition: (query: QueryBuilder<T>) => void): this;
    where(queryableModel: Partial<QueryableModel<T>>): this;
    where<Key extends ModelKey<T>>(field: Key, value: OperatorValue<T, Key, '='>): this;
    where<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: O, value: OperatorValue<T, Key, O>): this;
    where<Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | Operator | OperatorValue<T, Key, O>)[]) {
        if (args.length === 2) args = [args[0], '=', args[1],];

        if (args.length === 3) {
            const query = toMangoQuery(args[0] as any, args[1] as any, args[2] as any);
            this.queries.selector.$and.push(query);
            this.lastWhere = args[0] as ModelKey<T>;
            return this;
        } else {
            if (typeof args[0] === 'object') {
                Object.entries(args[0] as object).forEach(([key, value,]) => {
                    const query = queryableValueToValue(key as any, value);
                    this.queries.selector.$and.push(query);
                });
                return this;
            }
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0] as QueryBuilderFunction<T>, '$and');
                return this;
            }
        }
    }

    orWhere(condition: (query: QueryBuilder<T>) => void): this;
    orWhere(queryableModel: Partial<QueryableModel<T>>): this;
    orWhere<Key extends ModelKey<T>>(field: Key, value: OperatorValue<T, Key, '='>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: Operator, value: OperatorValue<T, Key, O>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | Operator | OperatorValue<T, Key, O> | ModelType<T> | QueryableModel<T>)[]) {
        if (args.length === 2) args = [args[0], '=', args[1],];

        const queries = this.queries.selector.$and;
        const lastQueryIndex = queries.length - 1;
        const lastQuery = queries[lastQueryIndex];
        this.queries.selector.$and = this.queries.selector.$and.filter((_, i) => i !== lastQueryIndex);

        if (args.length === 3) {
            const [field, operator, value,] = args as [ModelKey<T>, O, OperatorValue<T, Key, O>];
            const newQuery = toMangoQuery(field, operator, value);
            if (this.lastWhere === '$or') {
                if (!lastQuery.$or) lastQuery.$or = [];
                lastQuery.$or.push(newQuery);
                this.queries.selector.$and.push(lastQuery);
            } else {
                if (!lastQuery) {
                    this.queries.selector.$and.push({ $or: [newQuery,], });
                } else {
                    this.queries.selector.$and.push({ $or: [lastQuery, newQuery,], });
                }
            }
            this.lastWhere = '$or';
            return this;
        } else {
            if (typeof args[0] === 'object') {
                Object.entries(args[0] as object).forEach(([key, value,]) => {
                    let operator: Operator, objectValue: any;
                    if (value instanceof Array && operators.includes(value[0])) {
                        operator = value[0];
                        objectValue = value[1];
                    } else {
                        operator = '=';
                        objectValue = value;
                    }
                    this.orWhere(key as ModelKey<T>, operator, objectValue);
                });
                return this;
            }
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0] as QueryBuilderFunction<T>, '$or');
                return this;
            }
        }
    }

    whereCondition(condition: QueryBuilderFunction<T> | Partial<ModelType<T>>, type: '$and' | '$or'): this {
        if (typeof condition === 'function') {
            const newQueryBuilder = new QueryBuilder<T>(this.modelClass, []);
            (condition as QueryBuilderFunction<T>)(newQueryBuilder);
            this.queries.selector.$and = this.queries.selector.$and.concat(newQueryBuilder.queries.selector.$and || []);
        } else if (typeof condition === 'object') {
            Object.entries(condition).forEach(([key, value,]) => {
                let operator: Operator, objectValue: any;
                if (value instanceof Array && operators.includes(value[0])) {
                    operator = value[0];
                    objectValue = value[1];
                } else {
                    operator = '=';
                    objectValue = value;
                }

                if (type == '$and') {
                    this.where(key as ModelKey<T>, operator, objectValue);
                } else {
                    this.orWhere(key as ModelKey<T>, operator, objectValue);
                }
                this.lastWhere = key as ModelKey<T>;
            });
        }
        return this;
    }


    sortBy(field: keyof T, order: 'asc' | 'desc') {
        this.queries.sort?.push({ [field]: order, });
        return this;
    }

    paginate(page: number, limit: number) {
        this.queries.limit = limit;
        this.queries.skip = (page - 1) * limit;
        return this;
    }

    getQuery() {
        return this.queries;
    }

    protected async bindRelationship(model: T) {
        if (this.relationships && model.relationships) {
            for (const r of this.relationships) {
                try {
                    const queryBuilder = await model.relationships[r as string]() as QueryBuilder<T>;
                    if (queryBuilder.isOne) {
                        Object.assign(model, { [r]: await queryBuilder.first(), });
                    } else {
                        Object.assign(model, { [r]: await queryBuilder.get(), });
                    }
                } catch (error) {
                    throw new Error(`Relationship "${r as string}" does not exists in model ${model.constructor.name}`);
                }
            }
        }
        return model;
    }

    protected async cast(item?: ModelType<T>): Promise<T | undefined> {
        if (!item) return;
        let model;
        try {
            // @ts-ignore
            model = new this.modelClass() as T;
        } catch (error) {
            // @ts-ignore
            model = new this.modelClass.constructor() as T;
        }
        model.fill(item);
        model._dirty = {};
        model = await this.bindRelationship(model);
        return model;
    }

    async get(): Promise<T[]> {
        const data = await DatabaseManager.get(this.dbName).find(this.queries);
        const result = [] as T[];
        for (const item of data.docs) {
            const model = await this.cast(item as unknown as ModelType<T>);
            if (model) result.push(model);
        }
        return result;
    }

    async first(): Promise<T | undefined> {
        this.isOne = true;
        const result = await this.get();
        return result[0];
    }

    async count() {
        // todo: count
        return 0;
    }
}