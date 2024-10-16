var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import uuid from 'short-uuid';
import { decrypt } from '../encryption/encryption';
import { DatabaseManager } from '../manager/DatabaseManager';
import { BaseModel } from '../model/Model';
import { MultiQueryBuilder } from '../multi-database/MultiQueryBuilder';
import { convertIdFieldsToDocIds, getForeignIdFields } from '../relationships/RelationshipDecorator';
import { ApiRepo } from '../repo/ApiRepo';
const operators = ['=', '>', '>=', '<', '<=', '!=', 'in', 'not in', 'between', 'like',];
function toMangoOperator(operator) {
    if (operator === '=')
        return '$eq';
    if (operator === '!=')
        return '$ne';
    if (operator === '>')
        return '$gt';
    if (operator === '>=')
        return '$gte';
    if (operator === '<')
        return '$lt';
    if (operator === '<=')
        return '$lte';
    if (operator === 'in')
        return '$in';
    if (operator === 'not in')
        return '$nin';
    if (operator === 'between')
        return '$gte';
    if (operator === 'like')
        return '$regex';
    return '';
}
function toMangoQuery(field, operator, value) {
    if (field === 'id') {
        field = '_id';
    }
    if (['=', '!=', '>', '>=', '<', '<=',].includes(operator)) {
        return { [field]: { [toMangoOperator(operator)]: value, }, };
    }
    if (['in', 'not in',].includes(operator)) {
        return { [field]: { [toMangoOperator(operator)]: value, }, };
    }
    if (operator === 'between') {
        const [fromValue, toValue,] = value;
        return { [field]: { $gte: fromValue, $lte: toValue, }, };
    }
    if (operator === 'like') {
        return { [field]: { $regex: RegExp(value, 'i'), }, };
    }
    return {};
}
function idToMangoQuery(key, operator, value, cName) {
    if (key === 'id') {
        key = '_id';
    }
    if (!value)
        return {};
    if (['=', '!=', '>', '>=', '<', '<=',].includes(operator)) {
        if (!value.includes(cName)) {
            value = `${cName}.${value}`;
        }
    }
    if (['in', 'not in',].includes(operator)) {
        value = value.map((v) => {
            if (!v.includes(cName)) {
                return `${cName}.${v}`;
            }
            return v;
        });
    }
    if (operator === 'between') {
        const [fromValue, toValue,] = value;
        if (!fromValue.includes(cName)) {
            value[0] = `${cName}.${fromValue}`;
        }
        if (!toValue.includes(cName)) {
            value[1] = `${cName}.${toValue}`;
        }
    }
    if (operator === 'like') {
        value = `^${cName}.${value}`;
    }
    return toMangoQuery(key, operator, value);
}
function queryableValueToValue(field, value) {
    if (value instanceof Array && operators.includes(value[0])) {
        return toMangoQuery(field, value[0], value[1]);
    }
    else {
        return toMangoQuery(field, '=', value);
    }
}
export function getNewId() {
    return String(uuid.generate());
}
export class QueryBuilder {
    constructor(model, relationships, dbName, isOne, apiInfo) {
        this.softDelete = 'none';
        if (model.cName === undefined) {
            throw new Error('QueryBuilder create error: collectionName not found');
        }
        this.dbName = dbName;
        this.model = model;
        this.isMultiDatabase = this.model.multiDatabase;
        this.relationships = (relationships || []);
        this.queries = { selector: { $and: [], }, };
        this.isOne = isOne;
        this.db = DatabaseManager.get(this.dbName);
        if (!this.db)
            throw new Error(`Database ${this.dbName} not found`);
        this.apiInfo = apiInfo;
        if (this.apiInfo)
            this.api = new ApiRepo(this.apiInfo);
    }
    static query(model, relationships, dbName) {
        return new this(model, relationships, dbName, false);
    }
    static where(field, operator, value, model) {
        const builder = this.query(model);
        return builder.where(field, operator, value);
    }
    raw() {
        return this.db;
    }
    setRelationshipType(type, localKey, foreignKey) {
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
    find(id, forceFind) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id)
                return undefined;
            const doc = yield this.getDoc(id, forceFind);
            if (doc)
                return this.cast(doc);
            return undefined;
        });
    }
    /**
     * Add eager loading relationships
     * @param relationships relationships to load
     * @returns QueryBuilder
     */
    with(...relationships) {
        var _a;
        (_a = this.relationships) === null || _a === void 0 ? void 0 : _a.concat(relationships);
        return this;
    }
    where(...args) {
        if (args.length === 2)
            args = [args[0], '=', args[1],];
        if (args.length === 3) {
            const [field, operator, value,] = args;
            let newQuery;
            const idFields = getForeignIdFields(this.model);
            const hasRelationship = idFields.find((f) => f.field === field);
            if (field == 'id') {
                newQuery = idToMangoQuery('id', operator, value, this.model.cName);
            }
            else if (hasRelationship) {
                const cName = new hasRelationship.relationship().cName;
                newQuery = idToMangoQuery(field, operator, value, cName);
            }
            else {
                newQuery = toMangoQuery(field, operator, value);
            }
            this.queries.selector.$and.push(newQuery);
            this.lastWhere = args[0];
            return this;
        }
        else {
            if (typeof args[0] === 'object') {
                Object.entries(args[0]).forEach(([key, value,]) => {
                    const query = queryableValueToValue(key, value);
                    this.queries.selector.$and.push(query);
                });
                return this;
            }
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0], '$and');
                return this;
            }
        }
    }
    orWhere(...args) {
        if (args.length === 2)
            args = [args[0], '=', args[1],];
        const queries = this.queries.selector.$and;
        const lastQueryIndex = queries.length - 1;
        const lastQuery = queries[lastQueryIndex];
        this.queries.selector.$and = this.queries.selector.$and.filter((_, i) => i !== lastQueryIndex);
        if (args.length === 3) {
            const [field, operator, value,] = args;
            let newQuery;
            const idFields = getForeignIdFields(this.model);
            const hasRelationship = idFields.find((f) => f.field === field);
            if (field == 'id') {
                newQuery = idToMangoQuery('id', operator, value, this.model.cName);
            }
            else if (hasRelationship) {
                const cName = new hasRelationship.relationship().cName;
                newQuery = idToMangoQuery(field, operator, value, cName);
            }
            else {
                newQuery = toMangoQuery(field, operator, value);
            }
            if (this.lastWhere === '$or') {
                if (!lastQuery.$or)
                    lastQuery.$or = [];
                lastQuery.$or.push(newQuery);
                this.queries.selector.$and.push(lastQuery);
            }
            else {
                if (!lastQuery) {
                    this.queries.selector.$and.push({ $or: [newQuery,], });
                }
                else {
                    this.queries.selector.$and.push({ $or: [lastQuery, newQuery,], });
                }
            }
            this.lastWhere = '$or';
            return this;
        }
        else {
            if (typeof args[0] === 'object') {
                Object.entries(args[0]).forEach(([key, value,]) => {
                    let operator, objectValue;
                    if (value instanceof Array && operators.includes(value[0])) {
                        operator = value[0];
                        objectValue = value[1];
                    }
                    else {
                        operator = '=';
                        objectValue = value;
                    }
                    this.orWhere(key, operator, objectValue);
                });
                return this;
            }
            if (typeof args[0] === 'function') {
                this.whereCondition(args[0], '$or');
                return this;
            }
        }
    }
    whereCondition(condition, type) {
        if (typeof condition === 'function') {
            const newQueryBuilder = new QueryBuilder(this.model, [], this.dbName);
            condition(newQueryBuilder);
            this.queries.selector.$and = this.queries.selector.$and.concat(newQueryBuilder.queries.selector.$and || []);
        }
        else if (typeof condition === 'object') {
            Object.entries(condition).forEach(([key, value,]) => {
                let operator, objectValue;
                if (value instanceof Array && operators.includes(value[0])) {
                    operator = value[0];
                    objectValue = value[1];
                }
                else {
                    operator = '=';
                    objectValue = value;
                }
                if (type == '$and') {
                    this.where(key, operator, objectValue);
                }
                else {
                    this.orWhere(key, operator, objectValue);
                }
                this.lastWhere = key;
            });
        }
        return this;
    }
    withTrashed() {
        this.softDelete = 'with';
        return this;
    }
    onlyTrashed() {
        this.softDelete = 'only';
        return this;
    }
    withoutTrashed() {
        this.softDelete = 'none';
        return this;
    }
    orderBy(field, order = 'asc') {
        if (!this.sorters) {
            this.sorters = [];
        }
        this.sorters.push({ [field]: order, });
        return this;
    }
    paginate(page, limit) {
        this.queries.limit = limit;
        this.queries.skip = (page - 1) * limit;
        return this;
    }
    getQuery() {
        return this.queries;
    }
    getRelationships() {
        return this.relationships;
    }
    sort(data) {
        if (this.sorters) {
            for (const sort of this.sorters) {
                const [key, order,] = Object.entries(sort)[0];
                if (!key.includes('.')) {
                    data.sort((a, b) => {
                        if (a[key] > b[key]) {
                            return order === 'asc' ? 1 : -1;
                        }
                        if (a[key] < b[key]) {
                            return order === 'asc' ? -1 : 1;
                        }
                        return 0;
                    });
                }
                else {
                    const mainKey = key.split('.')[0];
                    const subKey = key.split('.').slice(1).join('.');
                    data.sort((a, b) => {
                        if (a[mainKey][subKey] > b[mainKey][subKey]) {
                            return order === 'asc' ? 1 : -1;
                        }
                        if (a[mainKey][subKey] < b[mainKey][subKey]) {
                            return order === 'asc' ? -1 : 1;
                        }
                        return 0;
                    });
                }
            }
        }
        return data;
    }
    bindRelationship(model) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!model.relationships)
                model.relationships = {};
            model.bindRelationships();
            if (this.relationships && model.relationships) {
                for (const r of this.relationships) {
                    try {
                        if (r.includes('.')) {
                            const mainRelationship = r.split('.')[0];
                            const subRelationships = r.split('.').slice(1).join('.');
                            const mainModel = model[mainRelationship];
                            if (mainModel && mainModel instanceof BaseModel) {
                                const newMainModel = yield new QueryBuilder(mainModel, [subRelationships,], this.dbName)
                                    .orderBy('createdAt', 'asc')
                                    .bindRelationship(mainModel);
                                model[mainRelationship] = newMainModel;
                            }
                            else if (mainModel && mainModel instanceof Array) {
                                const newMainModels = yield Promise.all(mainModel.map((m) => __awaiter(this, void 0, void 0, function* () {
                                    return yield new QueryBuilder(m, [subRelationships,], this.dbName)
                                        .orderBy('createdAt', 'asc')
                                        .bindRelationship(m);
                                })));
                                model[mainRelationship] = newMainModels;
                            }
                        }
                        else {
                            const queryBuilder = yield model.relationships[r]();
                            queryBuilder.orderBy('createdAt', 'asc');
                            if (queryBuilder.isOne) {
                                Object.assign(model, { [r]: yield queryBuilder.first(), });
                            }
                            else {
                                Object.assign(model, { [r]: yield queryBuilder.get(), });
                            }
                        }
                    }
                    catch (error) {
                        throw new Error(`Relationship "${r}" does not exists in model ${model.getClass().name}`);
                    }
                }
            }
            return model;
        });
    }
    cast(item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!item)
                return;
            let model;
            const klass = this.model.getClass();
            if (item._id) {
                item.id = item._id;
                delete item._id;
            }
            model = new klass(item);
            model._meta._dirty = {};
            model._meta._before_dirty = {};
            if (model._tempPeriod) {
                model._meta._period = model._tempPeriod;
                delete model._tempPeriod;
            }
            model = yield this.bindRelationship(model);
            model.setForeignFieldsToModelId();
            return model;
        });
    }
    getComparisonValue(item, key) {
        if (key.includes('.')) {
            return this.getComparisonValue(item[key.split('.')[0]], key.split('.').slice(1).join('.'));
        }
        return item[key];
    }
    checkOrTargetDoc(item, selectors) {
        let isTargetDoc = false;
        for (const selector of selectors) {
            const key = Object.keys(selector)[0];
            let comparisonValue;
            if (key.includes('.')) {
                comparisonValue = this.getComparisonValue(item, key);
            }
            else {
                comparisonValue = item[key];
            }
            const value = selector[key];
            const operator = Object.keys(value)[0];
            const operatorValue = value[operator];
            if (operator === '$eq') {
                isTargetDoc = comparisonValue === operatorValue;
            }
            else if (operator === '$ne') {
                isTargetDoc = comparisonValue !== operatorValue;
            }
            else if (operator === '$gt') {
                isTargetDoc = comparisonValue > operatorValue;
            }
            else if (operator === '$lt') {
                isTargetDoc = comparisonValue < operatorValue;
            }
            else if (operator === '$gte') {
                isTargetDoc = comparisonValue >= operatorValue;
            }
            else if (operator === '$lte') {
                isTargetDoc = comparisonValue <= operatorValue;
            }
            else if (operator === '$in') {
                isTargetDoc = operatorValue.includes(comparisonValue);
            }
            else if (operator === '$nin') {
                isTargetDoc = !operatorValue.includes(comparisonValue);
            }
            else if (operator === '$regex' && comparisonValue) {
                isTargetDoc = comparisonValue.match(operatorValue) !== null;
            }
            else if (Array.isArray(operatorValue)) {
                return this.checkIfTargetDoc(item);
            }
            if (isTargetDoc)
                return true;
        }
        return isTargetDoc;
    }
    checkIfTargetDoc(item) {
        let isTargetDoc = false;
        for (const selector of this.queries.selector.$and) {
            if (selector.$or) {
                return this.checkOrTargetDoc(item, selector.$or);
            }
            const key = Object.keys(selector)[0];
            let comparisonValue;
            if (key.includes('.')) {
                comparisonValue = this.getComparisonValue(item, key);
            }
            else {
                comparisonValue = item[key];
            }
            const value = selector[key];
            const operator = Object.keys(value)[0];
            const operatorValue = value[operator];
            if (operator === '$eq') {
                isTargetDoc = comparisonValue === operatorValue;
            }
            else if (operator === '$ne') {
                isTargetDoc = comparisonValue !== operatorValue;
            }
            else if (operator === '$gt') {
                isTargetDoc = comparisonValue > operatorValue;
            }
            else if (operator === '$lt') {
                isTargetDoc = comparisonValue < operatorValue;
            }
            else if (operator === '$gte') {
                isTargetDoc = comparisonValue >= operatorValue;
            }
            else if (operator === '$lte') {
                isTargetDoc = comparisonValue <= operatorValue;
            }
            else if (operator === '$in') {
                isTargetDoc = operatorValue.includes(comparisonValue);
            }
            else if (operator === '$nin') {
                isTargetDoc = !operatorValue.includes(comparisonValue);
            }
            else if (operator === '$regex' && comparisonValue) {
                isTargetDoc = comparisonValue.match(operatorValue) !== null;
            }
            else if (Array.isArray(operatorValue)) {
                return this.checkIfTargetDoc(item);
            }
            if (!isTargetDoc)
                return false;
        }
        return isTargetDoc;
    }
    jsSearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.find({
                selector: {
                    _id: { $regex: `^${this.model.cName}`, },
                },
                limit: 99999,
            });
            result.docs = result.docs.map((doc) => {
                const item = doc;
                if (!item.payload)
                    return item;
                const decryptedItem = decrypt(item.payload, this.dbName || 'default');
                const decryptedDoc = Object.assign({ _id: item._id, _rev: item._rev }, decryptedItem);
                return decryptedDoc;
            });
            result.docs = result.docs.filter((doc) => {
                const item = doc;
                let isTargetDoc = false;
                if (this.softDelete === 'none') {
                    isTargetDoc = !item.deletedAt;
                }
                else if (this.softDelete === 'only') {
                    isTargetDoc = !!item.deletedAt;
                }
                isTargetDoc = this.checkIfTargetDoc(item);
                return isTargetDoc;
            });
            return result.docs;
        });
    }
    mangoQuery(db) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queries.limit = 99999;
            const result = yield db.find(this.queries);
            return result.docs;
        });
    }
    setQueries(queries) {
        this.queries = queries;
        return this;
    }
    setIsMultiDatabase(isMultiDatabase) {
        this.isMultiDatabase = isMultiDatabase;
        return this;
    }
    setPeriod(period) {
        this.period = period;
        return this;
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.queries.selector.$and.push({
                _id: { $regex: `^${this.model.cName}`, },
            });
            if (this.softDelete === 'none') {
                this.where('deletedAt', '=', undefined);
                this.queries.selector.$and.push({
                    deletedAt: { $exists: false, },
                });
            }
            else if (this.softDelete === 'only') {
                this.where('deletedAt', '!=', undefined);
                this.queries.selector.$and.push({
                    deletedAt: { $exists: true, },
                });
            }
            if (this.isMultiDatabase) {
                const multiQb = new MultiQueryBuilder(this.model, this.relationships);
                multiQb.setQueryBuilder(this);
                return multiQb.get();
            }
            const db = DatabaseManager.get(this.dbName);
            if (!db) {
                throw new Error(`Database ${this.dbName} not found`);
            }
            let data;
            if (db.hasPassword) {
                data = yield this.jsSearch();
            }
            else {
                data = yield this.mangoQuery(db);
            }
            const sortedData = this.sort(data);
            data = sortedData;
            const result = [];
            for (const item of data) {
                const model = yield this.cast(item);
                if (this.period && (model === null || model === void 0 ? void 0 : model._meta)) {
                    model._meta._period = this.period;
                }
                if (model)
                    result.push(model);
            }
            return result;
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isOne = true;
            const result = yield this.get();
            return result[0];
        });
    }
    last() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isOne = true;
            const result = yield this.get();
            return result[result.length - 1];
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.get()).length;
        });
    }
    getDoc(id, forceFind) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!id)
                return undefined;
            if (!id.includes(this.model.cName + '.'))
                id = this.model.cName + '.' + id;
            try {
                const result = yield this.db.get(id);
                result.id = result._id;
                delete result._id;
                if (this.softDelete === 'none' && result.deletedAt !== undefined && !forceFind) {
                    return undefined;
                }
                return result;
            }
            catch (e) {
                if (this.apiInfo && this.apiInfo.apiFallbackGet) {
                    const result = yield ((_a = this.api) === null || _a === void 0 ? void 0 : _a.get(id));
                    if (!result)
                        return undefined;
                    delete result._rev;
                    if (id.includes(this.model.cName)) {
                        id = id.replace(`${this.model.cName}.`, '');
                    }
                    const createdItem = yield this.create(Object.assign(Object.assign({}, result), { id }), true);
                    result._meta = {};
                    result._meta._fallback_api_doc = true;
                    result._meta._rev = createdItem.rev;
                    result.id = createdItem.id;
                    delete result._id;
                    delete result._rev;
                    return result;
                }
                return undefined;
            }
        });
    }
    create(attributes, fallbackCreate = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!attributes.id) {
                attributes.id = getNewId();
            }
            if (!attributes.id.includes(this.model.cName)) {
                attributes.id = `${this.model.cName}.${attributes.id}`;
            }
            const newAttr = {};
            for (const key in attributes) {
                if (typeof attributes[key] === 'function') {
                    newAttr[key] = attributes[key].toString();
                }
            }
            const attr = Object.assign(Object.assign({}, attributes), newAttr);
            attr._id = attr.id;
            delete attr.id;
            const result = yield this.db.post(attr);
            if (this.apiInfo && this.apiInfo.apiAutoCreate && !fallbackCreate) {
                yield ((_a = this.api) === null || _a === void 0 ? void 0 : _a.create(attributes));
            }
            return result;
        });
    }
    update(attributes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.find(attributes.id);
            if (!doc)
                return { ok: false, };
            const newAttr = {};
            for (const key in attributes) {
                if (typeof attributes[key] === 'function') {
                    newAttr[key] = attributes[key].toString();
                }
            }
            let attr = Object.assign(Object.assign(Object.assign({}, doc.toJson()), attributes), newAttr);
            attr._id = attr.id;
            if (!doc._meta._rev)
                throw new Error('Document revision not found');
            attr._rev = doc._meta._rev;
            delete attr.id;
            attr = convertIdFieldsToDocIds(attr, this.model);
            for (const key in newAttr) {
                if (newAttr[key] === undefined || newAttr[key] === null) {
                    delete attr[key];
                }
            }
            const result = yield this.db.put(attr, {
                force: false,
            });
            if (this.apiInfo && this.apiInfo.apiAutoUpdate) {
                yield ((_a = this.api) === null || _a === void 0 ? void 0 : _a.update(attr));
            }
            return result;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const getResult = yield this.get();
            const idDeleteResult = {};
            yield Promise.all(getResult.map((item) => __awaiter(this, void 0, void 0, function* () {
                try {
                    idDeleteResult[item.id] = true;
                    yield item.delete();
                }
                catch (error) {
                    idDeleteResult[item.id] = false;
                }
            })));
            return idDeleteResult;
        });
    }
    deleteOne(id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.find(id, true);
            if (!doc) {
                return Promise.reject(new Error('Document not found'));
            }
            const rawDoc = doc.toJson();
            rawDoc._id = this.model.cName + '.' + id;
            rawDoc._rev = doc._meta._rev;
            const result = yield this.db.remove(rawDoc);
            if (this.apiInfo && this.apiInfo.apiAutoDelete) {
                yield ((_a = this.api) === null || _a === void 0 ? void 0 : _a.delete(id));
            }
            if (this.apiInfo && this.apiInfo.apiAutoSoftDelete) {
                yield ((_b = this.api) === null || _b === void 0 ? void 0 : _b.softDelete(id));
            }
            return result;
        });
    }
    createIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.createIndex(index);
        });
    }
}
//# sourceMappingURL=QueryBuilder.js.map