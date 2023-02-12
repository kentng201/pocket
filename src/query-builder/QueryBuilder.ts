import { ModelKey, ModelType, ModelValue } from 'src/definitions/Model';
import Model from 'src/model/Model';

const operators = ['=', '>', '>=', '<', '<=', '!=', 'in', 'not in', 'between', 'like'] as const;
export type Operator = typeof operators[number];
export type OperatorValue<T extends Model, Key extends keyof T, O extends Operator> = 
    O extends 'in' ? ModelValue<T, Key>[]
    : O extends 'not in' ? ModelValue<T, Key>[]
    : O extends 'between' ? [ModelValue<T, Key>, ModelValue<T, Key>]
    : O extends 'like' ? string
    : ModelValue<T, Key>
export type QueryableModel<T extends Model> = {
    [Key in ModelKey<T>]?: [Operator, OperatorValue<T, Key, Operator>];
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
    return '';
}

export default class QueryBuilder<T extends Model> {
    private queries: PouchDB.Find.FindRequest<T>;

    private lastWhere?: ModelKey<T> | '$or';
    private isOne?: boolean;
    private modelClass: Model;
    private dbName?: string;
    private relationships: ModelKey<T>[];

    constructor(modelClass: Model, relationships?: ModelKey<T>[], dbName?: string, isOne?: boolean) {
        if (modelClass.cName === undefined) {
            throw new Error('QueryBuilder create error: collectionName not found');
        }
        this.dbName = dbName;
        this.modelClass = modelClass;
        this.relationships = relationships || [];
        this.queries = {selector: {$and: []}};
        this.isOne = isOne;
    }

    private appendWhere<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: O, value: OperatorValue<T, Key, O>, type: '$and' | '$or'): void {
        if (value instanceof Array) {
            this.queries.selector[type]?.push({ [field] : { $gte: (value as any)[0], $lte: (value as any)[1] } });
        } else {
            this.queries.selector[type]?.push({ [field] : { [toMangoOperator(operator)]: value } });
        }
    }

    static query<T extends Model>(modelClass: Model, relationships?: ModelKey<T>[], dbName?: string) {
        return new this(modelClass, relationships, dbName, false) as QueryBuilder<T>;
    }

    static where<T extends Model>(field: ModelKey<T>, operator: Operator, value: any, modelClass: Model) {
        const builder = this.query<T>(modelClass);
        return builder.where(field, operator, value);
    }

    raw() {
        return {};
    }

    where(condition: (query: QueryBuilder<T>) => void): this;
    where(condition: Partial<ModelType<T>>): this;
    where<O extends Operator>(queryableModel: QueryableModel<T>): this;
    where<Key extends ModelKey<T>>(field: Key, value: OperatorValue<T, Key, '='>): this;
    where<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: O, value: OperatorValue<T, Key, O>): this;
    where<Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | Operator | OperatorValue<T, Key, O>)[]) {
        if (args.length === 2) args = [args[0], '=', args[1]];
            
        if (args.length === 3) {
            this.appendWhere(args[0] as ModelKey<T>, args[1] as Operator, args[2] as any, '$and');
            this.lastWhere = args[0] as ModelKey<T>;
            return this;
        } else {
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0] as QueryBuilderFunction<T>);
                return this;
            }
            if (typeof args[0] === 'object') {
                Object.entries(args[0] as object).forEach(([key, value]) => {
                    if (value instanceof Array && operators.includes(value[0])) {
                        const [operator, objectValue] = value;
                        this.where(key as ModelKey<T>, operator, objectValue);
                    } else {
                        this.where(key as ModelKey<T>, value);
                    }
                });
                return this;
            }
        }
    }

    orWhere(condition: (query: QueryBuilder<T>) => void): this;
    orWhere(condition: Partial<ModelType<T>>): this;
    orWhere<Key extends ModelKey<T>>(field: Key, value: OperatorValue<T, Key, '='>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(field: Key, operator: Operator, value: OperatorValue<T, Key, O>): this;
    orWhere(queryableModel: QueryableModel<T>): this;
    orWhere<Key extends ModelKey<T>, O extends Operator>(...args: (ModelKey<T> | Operator | OperatorValue<T, Key, O>)[]) {
        if (args.length === 2) args = [args[0], '=', args[1]];

        const { lastWhere } = this;
        const queries = this.queries.selector.$and || [];
        const lastQueryIndex = queries.length - 1;
        const lastQuery = queries[lastQueryIndex];
        this.queries.selector.$and = this.queries.selector.$and?.filter((query, i) => i !== lastQueryIndex);
        const newQuery: PouchDB.Find.Selector = {};
            
        if (args.length === 3) {
            this.appendWhere(args[0] as ModelKey<T>, args[1] as Operator, args[2] as any, '$or');
            if (lastWhere === '$or') {
                lastQuery.$or?.push(newQuery);
                this.queries.selector.$and?.push(lastQuery);
            } else {
                this.queries.selector.$and?.push({ $or: [
                    lastQuery,
                    newQuery,
                ]});
            }
            this.lastWhere = '$or';
            return this;
        } else {
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0] as QueryBuilderFunction<T>);
                return this;
            }
            if (typeof args[0] === 'object') {
                Object.entries(args[0] as object).forEach(([key, value]) => {
                    if (value instanceof Array && operators.includes(value[0])) {
                        const [operator, objectValue] = value;
                        this.orWhere(key as ModelKey<T>, operator, objectValue);
                    } else {
                        this.orWhere(key as ModelKey<T>, value);
                    }
                });
                return this;
            }
        }
    }

    whereCondition(condition: QueryBuilderFunction<T> | Partial<ModelType<T>>): this {
        if (typeof condition === 'function') {
            const newQueryBuilder = new QueryBuilder<T>(this.modelClass, []);
            (condition as QueryBuilderFunction<T>)(newQueryBuilder);
            this.queries.selector.$and = this.queries.selector.$and?.concat(newQueryBuilder.queries.selector.$and || []);
        } else if (typeof condition === 'object') {
            Object.entries(condition).forEach(([field, value]) => {
                const [operator, objectValue] = value;
                if (objectValue instanceof Array) {
                    this.queries.selector.$and?.push({ [field] : { $gte: value[0], $lte: value[1] } });
                } else {
                    this.queries.selector.$and?.push({ [field] : { [toMangoOperator(operator)]: value } });
                }
            });
        }
        this.lastWhere = undefined;
        return this;
    }


    sortBy(field: keyof T, order: 'asc' | 'desc') {
        this.queries.sort?.push({ [field]: order });
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

    private async bindRelationship(model: T) {
        if (this.relationships && model.relationships) {
            for (const r of this.relationships) {
                try {
                    const queryBuilder = await model.relationships[r as string]() as QueryBuilder<T>;
                    if (queryBuilder.isOne) {
                        Object.assign(model, { [r]: await queryBuilder.first() });
                    } else {
                        Object.assign(model, { [r]: await queryBuilder.get() });
                    }
                } catch (error) {
                    throw new Error(`Relationship "${r as string}" does not exists in model ${model.constructor.name}`);
                }
            }
        }
        return model;
    }

    private async cast(item?: T) {
        if (!item) return;
        let model;
        const modelClass = this.modelClass;
        const modelClassConstructor = modelClass.constructor;
        model  = modelClassConstructor();
        model.fill(item);
        model = await this.bindRelationship(model);
        return model;
    }

    async get(): Promise<T[]> {
        return [];
    }

    async first(): Promise<T | undefined> {
        this.isOne = true;
        return (await this.get())[0];
    }

    async count() {
        // todo: count
        return 0;
    }

    async create<T>(attributes: Partial<T>): Promise<T> {
        // todo: create
        return new Model() as T;
    }

    async update<T>(attributes: Partial<T>): Promise<T> {
        // todo: update
        return new Model() as T;
    }

    async delete(): Promise<boolean> {
        // todo: delete
        return false;
    }
}