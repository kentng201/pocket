import uuid from 'short-uuid';
import { ValidDotNotationArray } from 'src/definitions/DotNotation';
import { ModelKey, ModelType, ModelValue, NewModelType } from 'src/definitions/Model';
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
export type QueryBuilderFunction<T extends Model> = (query: QueryBuilder<T>) => void;

function toMangoOperator(operator: Operator): string {
    if (operator === '=') return '$eq';
    if (operator === '!=') return '$ne';
    if (operator === '>') return '$gt';
    if (operator === '>=') return '$gte';
    if (operator === '<') return '$lt';
    if (operator === '<=') return '$lte';
    if (operator === 'in') return '$in';
    if (operator === 'not in') return '$nin';
    if (operator === 'between') return '$gte';
    if (operator === 'like') return '$regex';
    return '';
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
function queryableValueToValue<T extends Model, Key extends ModelKey<T>>(field: Key, value: ModelValue<T, Key>): PouchDB.Find.Selector {
    if (value instanceof Array && operators.includes(value[0])) {
        return toMangoQuery<T, Key, typeof value[0]>(field, value[0], value[1]);
    } else {
        return toMangoQuery<T, Key, '='>(field, '=', value);
    }
}

export enum RelationshipType {
    HAS_ONE = 'HAS_ONE',
    HAS_MANY = 'HAS_MANY',
    BELONGS_TO = 'BELONGS_TO',
    BELONGS_TO_MANY = 'BELONGS_TO_MANY',
}


export class QueryBuilder<T extends Model, K extends string[] = []> {
    protected queries: PouchDB.Find.FindRequest<T> & { selector: { $and: PouchDB.Find.Selector[] } };
    protected sorters?: Array<string | { [propName: string]: 'asc' | 'desc' }>;

    protected lastWhere?: ModelKey<T> | '$or';
    protected isOne?: boolean;
    protected modelClass: T;
    protected dbName?: string;
    protected relationships?: ValidDotNotationArray<T, K>;
    protected db: PouchDB.Database;
    protected apiInfo?: APIResourceInfo;
    public api?: ApiRepo<T>;

    protected relationshipType?: RelationshipType;
    protected localKey?: string;
    protected foreignKey?: string;

    constructor(modelClass: T, relationships?: ValidDotNotationArray<T, K>, dbName?: string, isOne?: boolean, apiInfo?: APIResourceInfo) {
        if (modelClass.cName === undefined) {
            throw new Error('QueryBuilder create error: collectionName not found');
        }
        this.dbName = dbName;
        this.modelClass = modelClass;
        this.relationships = (relationships || []) as ValidDotNotationArray<T, K>;
        this.queries = { selector: { $and: [], }, };
        this.isOne = isOne;
        this.db = DatabaseManager.get(this.dbName) as PouchDB.Database<T>;
        if (!this.db) throw new Error(`Database ${this.dbName} not found`);
        this.apiInfo = apiInfo;
        if (this.apiInfo) this.api = new ApiRepo<T>(this.apiInfo);
    }

    static query<T extends Model, K extends string[] = []>(modelClass: T, relationships?: ValidDotNotationArray<T, K>, dbName?: string) {
        return new this(modelClass, relationships, dbName, false) as QueryBuilder<T, K>;
    }

    static where<T extends Model, O extends Operator>(field: ModelKey<T>, operator: O, value: OperatorValue<T, ModelKey<T>, O>, modelClass: T) {
        const builder = this.query<T>(modelClass);
        return builder.where(field, operator, value);
    }

    raw(): PouchDB.Database {
        return this.db;
    }

    setRelationshipType(type: RelationshipType, localKey: string, foreignKey: string) {
        this.relationshipType = type;
        this.localKey = localKey;
        this.foreignKey = foreignKey;
    }
    getRelationshipType() {
        return this.relationshipType;
    }
    getLocalKey() {
        return this.localKey;
    }
    getForeignKey() {
        return this.foreignKey;
    }

    async find(_id: string): Promise<T | undefined> {
        try {
            const doc = await this.db.get(_id);
            return this.cast(doc as ModelType<T>);
        } catch (e) {
            return undefined;
        }
    }

    where(condition: (query: QueryBuilder<T>) => void): this;
    where(queryableModel: Partial<QueryableModel<T>>): this;
    where<Key extends ModelKey<T>>(field: Key, value: OperatorValue<T, Key, '='>): this;
    where<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: O, value: OperatorValue<T, Key, O>): this;
    where<Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | Operator | OperatorValue<T, Key, O>)[]) {
        if (args.length === 2) args = [args[0], '=', args[1],];

        if (args.length === 3) {
            const [field, operator, value,] = args as [ModelKey<T>, O, OperatorValue<T, Key, O>];
            const newQuery = toMangoQuery(field, operator, value);
            this.queries.selector.$and.push(newQuery);
            this.lastWhere = args[0] as ModelKey<T>;
            return this;
        } else {
            if (typeof args[0] === 'object') {
                Object.entries(args[0] as object).forEach(([key, value,]) => {
                    const query = queryableValueToValue<T, Key>(key as Key, value);
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
                    let operator: Operator, objectValue: OperatorValue<T, ModelKey<T>, Operator>;
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
            const newQueryBuilder = new QueryBuilder<T, []>(this.modelClass, [] as ValidDotNotationArray<T, []>, this.dbName);
            (condition as QueryBuilderFunction<T>)(newQueryBuilder);
            this.queries.selector.$and = this.queries.selector.$and.concat(newQueryBuilder.queries.selector.$and || []);
        } else if (typeof condition === 'object') {
            Object.entries(condition).forEach(([key, value,]) => {
                let operator: Operator, objectValue: OperatorValue<T, ModelKey<T>, Operator>;
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


    orderBy(field: keyof T, order: 'asc' | 'desc' = 'asc') {
        if (!this.sorters) {
            this.sorters = [];
        }
        this.sorters.push({ [field]: order, });
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

    private sort(data: T[]) {
        if (this.sorters) {
            for (const sort of this.sorters) {
                const [key, order,] = Object.entries(sort)[0];
                data.sort((a, b) => {
                    if (a[key as ModelKey<T>] > b[key as ModelKey<T>]) {
                        return order === 'asc' ? 1 : -1;
                    }
                    if (a[key as ModelKey<T>] < b[key as ModelKey<T>]) {
                        return order === 'asc' ? -1 : 1;
                    }
                    return 0;
                });
            }
        }
        return data;
    }

    private async bindRelationship(model: T) {
        if (this.relationships && model.relationships) {
            for (const r of this.relationships) {
                try {
                    if (r.includes('.')) {
                        const mainRelationship = r.split('.')[0];
                        const subRelationships = r.split('.').slice(1).join('.');
                        const mainModel = model[mainRelationship as keyof T] as Model | Model[];
                        if (mainModel && mainModel instanceof Model) {
                            const newMainModel = await new QueryBuilder(mainModel, [subRelationships,], this.dbName)
                                .orderBy('createdAt', 'asc')
                                .bindRelationship(mainModel);
                            const result = model[mainRelationship as keyof T];
                            model[mainRelationship as keyof T] = newMainModel as ModelValue<T, keyof T>;
                        } else if (mainModel && mainModel instanceof Array) {
                            const newMainModels = await Promise.all(mainModel.map(async (m) => await new QueryBuilder(m, [subRelationships,], this.dbName)
                                .orderBy('createdAt', 'asc')
                                .bindRelationship(m)));
                            model[mainRelationship as keyof T] = newMainModels as ModelValue<T, keyof T>;
                        }
                    } else {
                        const queryBuilder = await model.relationships[r as string]() as QueryBuilder<T>;
                        queryBuilder.orderBy('createdAt', 'asc');
                        if (queryBuilder.isOne) {
                            Object.assign(model, { [r]: await queryBuilder.first(), });
                        } else {
                            Object.assign(model, { [r]: await queryBuilder.get(), });
                        }
                    }
                } catch (error) {
                    throw new Error(`Relationship "${r as string}" does not exists in model ${model.getClass().name}`);
                }
            }
        }
        return model;
    }

    protected async cast(item?: ModelType<T>): Promise<T | undefined> {
        if (!item) return;
        let model;
        const klass = this.modelClass.getClass();
        model = new klass(item) as T;
        model._dirty = {};
        model._before_dirty = {};
        model = await this.bindRelationship(model);
        return model;
    }

    async get(): Promise<T[]> {
        this.queries.selector.$and.push({
            _id: { $regex: `^${this.modelClass.cName}`, },
        });
        const data = await DatabaseManager.get(this.dbName).find(this.queries);
        const sortedData = this.sort(data.docs as any);
        data.docs = sortedData;
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
        return (await this.get()).length;
    }

    async getDoc(_id: string): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta | undefined> {
        try {
            const result = await this.db.get(_id);
            return result;
        } catch (e) {
            if (this.apiInfo && this.apiInfo.apiFallbackGet) {
                const result = await this.api?.get(_id);
                if (!result) return undefined;
                delete (result as any)._rev;
                if (_id.includes(this.modelClass.cName)) {
                    _id = _id.replace(`${this.modelClass.cName}.`, '');
                }
                const createdItem = await this.create({ ...result, _id, } as NewModelType<T>, true);
                result._fallback_api_doc = true;
                result._rev = createdItem.rev;
                result._id = createdItem.id;
                return result;
            }
            return undefined;
        }
    }

    async create(attributes: NewModelType<T>, fallbackCreate = false): Promise<PouchDB.Core.Response> {
        if (!attributes._id) {
            attributes._id = String(uuid.generate());
        }
        if (!attributes._id.includes(this.modelClass.cName)) {
            attributes._id = `${this.modelClass.cName}.${attributes._id}`;
        }
        const result = await this.db.post(attributes);
        if (this.apiInfo && this.apiInfo.apiAutoCreate && !fallbackCreate) {
            await this.api?.create(attributes);
        }
        return result;
    }

    async update(attributes: Partial<ModelType<T>>): Promise<PouchDB.Core.Response> {
        const doc = await this.getDoc(attributes._id as string);
        const result = await this.db.put({ ...doc, ...attributes, }, {
            force: false,
        });
        if (this.apiInfo && this.apiInfo.apiAutoUpdate) {
            await this.api?.update({ ...doc, ...attributes, });
        }
        return result;
    }

    async delete(_id: string): Promise<PouchDB.Core.Response> {
        const doc = await this.getDoc(_id);
        if (!doc) {
            return Promise.reject(new Error('Document not found'));
        }
        const result = await this.db.remove(doc);
        if (this.apiInfo && this.apiInfo.apiAutoDelete) {
            await this.api?.delete(_id);
        }
        if (this.apiInfo && this.apiInfo.apiAutoSoftDelete) {
            await this.api?.softDelete(_id);
        }
        return result;
    }
}