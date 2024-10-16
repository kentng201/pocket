"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiQueryBuilder = void 0;
const __1 = require("..");
const MutliDatabaseConfig_1 = require("./MutliDatabaseConfig");
const MultiDatabase_1 = __importDefault(require("./MultiDatabase"));
const moment_1 = __importDefault(require("moment"));
class MultiQueryBuilder {
    setQueryBuilder(queryBuilder) {
        this.queryBuilder = queryBuilder;
    }
    constructor(model, relationships) {
        this.model = model;
        const mainDbName = (0, MutliDatabaseConfig_1.getMainDatabaseName)();
        if (!model.multiDatabase)
            throw new Error(`Model ${model.cName} is not multi database enabled`);
        this.queryBuilder = __1.QueryBuilder.query(model, relationships, mainDbName);
    }
    static query(model, relationships) {
        return new this(model, relationships);
    }
    static where(field, operator, value, model) {
        const builder = this.query(model);
        builder.where(field, operator, value);
        return this;
    }
    with(...relationships) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queryBuilder.with(...relationships);
            return this;
        });
    }
    where(...args) {
        this.queryBuilder.where(args[0], args[1], args[2]);
        return this;
    }
    orWhere(...args) {
        this.queryBuilder.orWhere(args[0], args[1], args[2]);
        return this;
    }
    withTrashed() {
        this.queryBuilder.withTrashed();
        return this;
    }
    onlyTrashed() {
        this.queryBuilder.onlyTrashed();
        return this;
    }
    withoutTrashed() {
        this.queryBuilder.withoutTrashed();
        return this;
    }
    orderBy(field, order = 'asc') {
        this.queryBuilder.orderBy(field, order);
        return this;
    }
    paginate(page, limit) {
        this.paginateLimit = limit;
        this.paginateSkip = (page - 1) * limit;
        return this;
    }
    getQuery() {
        return this.queryBuilder.getQuery();
    }
    getDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionDatabases = MultiDatabase_1.default.databases;
            return transactionDatabases;
        });
    }
    getDbsName() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbs();
            return dbs.map(db => db.config.dbName);
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbs();
            const dbNames = yield this.getDbsName();
            const query = this.getQuery();
            // handle pagination
            if (typeof this.paginateLimit === 'number' && typeof this.paginateSkip === 'number') {
                const countResults = yield Promise.all(dbNames.map(db => __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db).setIsMultiDatabase(false).setQueries(query).count()));
                let skip = this.paginateSkip;
                let limit = this.paginateLimit;
                const results = yield Promise.all(dbs.map((db) => __awaiter(this, void 0, void 0, function* () {
                    const count = countResults.shift();
                    if (skip >= count) {
                        skip -= count;
                        return [];
                    }
                    const result = yield __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db.config.dbName).setPeriod(db.period).setIsMultiDatabase(false).setQueries(query).paginate(skip, limit).get();
                    limit -= result.length;
                    skip = 0;
                    return result;
                })));
                return results.flat();
            }
            const results = yield Promise.all(dbs.map((db) => __awaiter(this, void 0, void 0, function* () {
                const result = yield __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db.config.dbName).setPeriod(db.period).setIsMultiDatabase(false).setQueries(query).get();
                return result;
            })));
            return results.flat();
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.get();
            return result[0];
        });
    }
    last() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.get();
            return result[result.length - 1];
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            const query = this.getQuery();
            const counts = yield Promise.all(dbs.map(db => __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db).setIsMultiDatabase(false).setQueries(query).count()));
            return counts.reduce((acc, count) => acc + count, 0);
        });
    }
    getDoc(id, forceFind) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            const query = this.getQuery();
            const results = yield Promise.all(dbs.map(db => {
                const result = __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db).setIsMultiDatabase(false).setQueries(query).get();
                return result.then(docs => {
                    const found = docs.find(doc => doc.id === id);
                    if (found)
                        return db;
                    return undefined;
                });
            }));
            const foundDatabase = results.find(db => db !== undefined);
            const doc = __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), foundDatabase).setQueries(query).getDoc(id, forceFind);
            return doc;
        });
    }
    create(attributes, currentPeriod = (0, moment_1.default)().format('YYYY-MM'), fallbackCreate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbs();
            let db = dbs.find(db => db.period === currentPeriod);
            if (!db) {
                db = yield MultiDatabase_1.default.createDatabase(currentPeriod);
            }
            return __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db.config.dbName).create(attributes, fallbackCreate);
        });
    }
    update(attributes, period) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            if (period) {
                const db = dbs.find(db => db === `${(0, MutliDatabaseConfig_1.getMainDatabaseName)()}-${period}`);
                const qb = __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db);
                if (db) {
                    const model = yield qb.find(attributes.id);
                    if (model) {
                        const updateResponse = yield qb.update(attributes);
                        model._meta._rev = updateResponse.rev;
                        return model;
                    }
                }
            }
            else {
                const resultArray = yield Promise.all(dbs.map((db) => __awaiter(this, void 0, void 0, function* () {
                    const qb = __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db);
                    const model = yield qb.find(attributes.id);
                    if (model) {
                        const updateResponse = yield qb.update(attributes);
                        model._meta._rev = updateResponse.rev;
                        return model;
                    }
                    return null;
                })));
                return resultArray.find(result => result !== null);
            }
            return null;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbs();
            yield Promise.all(dbs.map(db => __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db.name).delete()));
        });
    }
    deleteOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            yield Promise.all(dbs.map(db => __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db).deleteOne(id)));
        });
    }
    find(id, forceFind = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            const results = yield Promise.all(dbs.map(db => __1.QueryBuilder.query(this.model, this.queryBuilder.getRelationships(), db).find(id, forceFind)));
            return results.find(result => result !== undefined);
        });
    }
    createIndex(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const dbs = yield this.getDbsName();
            yield Promise.all(dbs.map(db => __1.QueryBuilder.query(this.model, [], db).createIndex(index)));
        });
    }
}
exports.MultiQueryBuilder = MultiQueryBuilder;
//# sourceMappingURL=MultiQueryBuilder.js.map