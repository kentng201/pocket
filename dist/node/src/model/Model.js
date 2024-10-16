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
exports.Model = exports.BaseModel = exports.setDefaultNeedSoftDelete = exports.setDefaultNeedTimestamp = exports.setDefaultDbName = void 0;
const QueryBuilder_1 = require("../query-builder/QueryBuilder");
const RepoManager_1 = require("../manager/RepoManager");
const BelongsTo_1 = require("../relationships/BelongsTo");
const HasOne_1 = require("../relationships/HasOne");
const HasMany_1 = require("../relationships/HasMany");
const BelongsToMany_1 = require("../relationships/BelongsToMany");
const moment_1 = __importDefault(require("moment"));
const pluralize_1 = __importDefault(require("pluralize"));
const RealTimeModel_1 = require("../real-time/RealTimeModel");
const RelationshipType_1 = require("../definitions/RelationshipType");
const __1 = require("..");
const ModelDecorator_1 = require("./ModelDecorator");
const MultiQueryBuilder_1 = require("../multi-database/MultiQueryBuilder");
const MultiDatabase_1 = __importDefault(require("../multi-database/MultiDatabase"));
const MutliDatabaseConfig_1 = require("../multi-database/MutliDatabaseConfig");
function setDefaultDbName(dbName) {
    BaseModel.dbName = dbName;
    return BaseModel.dbName;
}
exports.setDefaultDbName = setDefaultDbName;
function setDefaultNeedTimestamp(timestamp) {
    BaseModel.timestamp = timestamp;
    return BaseModel.timestamp;
}
exports.setDefaultNeedTimestamp = setDefaultNeedTimestamp;
function setDefaultNeedSoftDelete(softDelete) {
    BaseModel.softDelete = softDelete;
    return BaseModel.softDelete;
}
exports.setDefaultNeedSoftDelete = setDefaultNeedSoftDelete;
class BaseModel {
    getClass() {
        return this.constructor;
    }
    get cName() {
        return this.getClass().collectionName || (0, pluralize_1.default)(this.getClass().name, 2);
    }
    get dName() {
        return this.getClass().dbName;
    }
    get multiDatabase() {
        return this.getClass().multiDatabase;
    }
    get needTimestamp() {
        let timestamp = this.getClass().timestamp;
        if (!timestamp) {
            timestamp = true;
        }
        return timestamp;
    }
    get needSoftDelete() {
        let softDelete = this.getClass().softDelete;
        if (!softDelete) {
            softDelete = true;
        }
        return softDelete;
    }
    get aName() {
        return this.getClass().apiName;
    }
    get aResource() {
        return this.getClass().apiResource;
    }
    get aAuto() {
        return this.getClass().apiAuto;
    }
    get docId() {
        var _a;
        return ((_a = this.id) === null || _a === void 0 ? void 0 : _a.includes(this.cName + '.')) ? this.id : this.cName + '.' + this.id;
    }
    get modelId() {
        var _a;
        return ((_a = this.id) === null || _a === void 0 ? void 0 : _a.includes(this.cName + '.')) ? this.id.replace(this.cName + '.', '') : this.id;
    }
    // start of object construction
    fill(attributes) {
        var _a, _b, _c;
        if (attributes.id)
            attributes.id = attributes.id.replace(this.cName + '.', '');
        if ((_a = attributes._meta) === null || _a === void 0 ? void 0 : _a._before_dirty)
            delete attributes._meta._before_dirty;
        if ((_b = attributes._meta) === null || _b === void 0 ? void 0 : _b._dirty)
            delete attributes._meta._dirty;
        // convert function string to function
        for (const key in attributes) {
            // @ts-ignore
            if (typeof attributes[key] === 'string' && ((_c = attributes[key]) === null || _c === void 0 ? void 0 : _c.includes('=>'))) {
                const funcString = attributes[key];
                const func = new Function('return ' + funcString)();
                attributes[key] = func;
            }
        }
        Object.assign(this, attributes);
        if (!this._meta)
            this._meta = {};
        if (!this._meta._dirty)
            this._meta._dirty = {};
        if (!this._meta._before_dirty)
            this._meta._before_dirty = {};
        this._meta._rev = this._rev;
        delete this._rev;
        for (const key of Object.keys(attributes)) {
            this._meta._before_dirty[key] = this[key];
            this._meta._dirty[key] = true;
        }
        if (!this.relationships)
            this.relationships = {};
        this.bindRelationships();
    }
    constructor(attributes) {
        this.id = '';
        if (!this._meta)
            this._meta = {};
        if (attributes)
            this.fill(attributes);
        if (attributes && attributes._rev) {
            this._meta._rev = attributes._rev;
            delete attributes._rev;
        }
        const handler = {
            set: (target, key, value) => {
                if (value === undefined && attributes && Object.keys(attributes).includes(key) && target._meta._before_dirty[key] === undefined) {
                    value = attributes[key];
                }
                // prevent update reserved fields
                // const RESERVED_FIELDS = ['id', 'createdAt', 'updatedAt', 'relationships', '_dirty'];
                // if (RESERVED_FIELDS.includes(key) && target[key]) {
                //     throw new Error(`Cannot update reserved field ${key}`);
                // }
                if (!target._meta)
                    target._meta = {};
                if (!target._meta._dirty)
                    target._meta._dirty = {};
                if (!target._meta._before_dirty)
                    target._meta._before_dirty = {};
                if (key === '_meta' || key === 'relationships') {
                    target[key] = value;
                    return true;
                }
                if (target[key] && target._meta._before_dirty[key] === undefined) {
                    target._meta._before_dirty[key] = target[key];
                }
                try {
                    target[key] = value;
                    target._meta._dirty[key] = true;
                }
                catch (e) {
                    // try fix that the target[key] might only have getter
                    return true;
                }
                return true;
            },
        };
        return new Proxy(this, handler);
    }
    replicate() {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel.id;
        delete replicatedModel._meta._rev;
        return replicatedModel;
    }
    // end of object construction
    // start of foreign key handling
    setForeignFieldsToDocId() {
        const meta = Object.assign({}, this._meta);
        const result = (0, __1.convertIdFieldsToDocIds)(this, this);
        this.fill(result);
        meta._dirty = {};
        meta._before_dirty = {};
        this._meta = meta;
        return this;
    }
    setForeignFieldsToModelId() {
        const meta = Object.assign({}, this._meta);
        const result = (0, __1.convertIdFieldsToModelIds)(this, this);
        this.fill(result);
        meta._dirty = {};
        meta._before_dirty = {};
        this._meta = meta;
        return this;
    }
    // end of foreign key handling
    // start of CRUD operation
    /**
     * @deprecated retuen query builder of the model
     * @returns A query builder of that model
     */
    static repo() {
        return RepoManager_1.RepoManager.get(new this());
    }
    /**
     * Get the first model in the collection
     * @returns a model or undefined
     */
    static first() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).first();
    }
    /**
     * Count all models
     * @returns number of models
     */
    static count() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).count();
    }
    /**
     * Get all models
     * @returns an array of models
     */
    static all() {
        return __awaiter(this, void 0, void 0, function* () {
            return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).get();
        });
    }
    /**
     * Find a model by primary key
     * @param primaryKey id of the model
     * @returns a model or undefined
     */
    static find(primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!primaryKey)
                return undefined;
            if ((new this).multiDatabase) {
                const result = yield Promise.all(MultiDatabase_1.default.databases.map((db) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const item = yield ((_a = __1.DatabaseManager
                        .get(db.localDatabaseName)) === null || _a === void 0 ? void 0 : _a.get(`${(new this).cName}.${primaryKey}`).then((doc) => {
                        if (!doc)
                            return null;
                        const result = new this(doc);
                        if (result._tempPeriod) {
                            result._meta._period = result._tempPeriod;
                            delete result._tempPeriod;
                        }
                        return result;
                    }).catch(() => null));
                    if (item)
                        return item;
                    return undefined;
                })));
                return result.find((item) => item !== undefined);
            }
            const item = yield RepoManager_1.RepoManager.get(new this()).getDoc(primaryKey);
            if (!item)
                return undefined;
            const model = new this(item);
            model.setForeignFieldsToModelId();
            return model;
        });
    }
    /**
     * Create a new model
     * @param attributes attributes of the model
     * @param databasePeriod period of the database, format YYYY-MM
     * @returns a new model
     */
    static create(attributes, databasePeriod) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = new this();
            if (model.needTimestamp) {
                attributes.createdAt = (0, moment_1.default)().format();
                attributes.updatedAt = (0, moment_1.default)().format();
            }
            model.fill(attributes);
            const hasDocumentInDb = yield model.getClass().find(attributes.id);
            if (hasDocumentInDb)
                throw new Error('Document already exists');
            if (databasePeriod)
                model._meta._period = databasePeriod;
            yield model.save();
            return model;
        });
    }
    /**
     * Update an existing model
     * @param attributes attributes of the model
     * @returns this
     */
    update(attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const guarded = this.getClass().readonlyFields;
            attributes.id = this.id;
            delete attributes.relationships;
            if (this.needTimestamp)
                attributes.updatedAt = (0, moment_1.default)().format();
            let updateAttributes = {};
            updateAttributes = {};
            for (const key in attributes) {
                if (!(guarded === null || guarded === void 0 ? void 0 : guarded.includes(key))) {
                    updateAttributes[key] = attributes[key];
                }
            }
            this.fill(updateAttributes);
            yield this.save();
            return this;
        });
    }
    /**
     * Save the sub-models of this model
     * @returns this
     */
    saveChildren() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            for (const field in this) {
                if (Array.isArray(this[field]) && this[field][0] instanceof BaseModel) {
                    const query = (_b = (_a = this.relationships)[field]) === null || _b === void 0 ? void 0 : _b.call(_a);
                    if ((query === null || query === void 0 ? void 0 : query.getRelationshipType()) === RelationshipType_1.RelationshipType.HAS_MANY) {
                        const children = this[field];
                        const newChildren = [];
                        for (const child of children) {
                            const newChild = new (child.getClass())();
                            const foreignKey = query.getForeignKey();
                            child[foreignKey] = this.docId;
                            newChild.fill(child);
                            yield newChild.save();
                            const meta = Object.assign({}, newChild._meta);
                            meta._dirty = {};
                            meta._before_dirty = {};
                            newChild._meta = meta;
                            newChildren.push(newChild);
                        }
                        this[field] = newChildren;
                    }
                }
                else if (this[field] instanceof BaseModel) {
                    const query = (_d = (_c = this.relationships)[field]) === null || _d === void 0 ? void 0 : _d.call(_c);
                    if ((query === null || query === void 0 ? void 0 : query.getRelationshipType()) === RelationshipType_1.RelationshipType.HAS_ONE) {
                        const child = this[field];
                        const foreignKey = query.getForeignKey();
                        if (!child[foreignKey]) {
                            child[foreignKey] = this.docId;
                        }
                        const newChild = new (child.getClass())();
                        newChild.fill(child);
                        yield newChild.save();
                        const meta = Object.assign({}, newChild._meta);
                        meta._dirty = {};
                        meta._before_dirty = {};
                        newChild._meta = meta;
                        this[field] = newChild;
                    }
                }
            }
            return this;
        });
    }
    bindRelationships() {
        if (!this.relationships)
            this.relationships = {};
        const relationships = (0, __1.getRelationships)(this);
        Object.keys(relationships).forEach((key) => {
            const relationshipParams = relationships[key];
            const queryBuilder = () => {
                const relationshipName = relationshipParams[1][0];
                const relationship = (0, ModelDecorator_1.getModelClass)(relationshipName);
                if (relationshipParams[0] === RelationshipType_1.RelationshipType.BELONGS_TO) {
                    return this.belongsTo(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType_1.RelationshipType.HAS_MANY) {
                    return this.hasMany(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType_1.RelationshipType.HAS_ONE) {
                    return this.hasOne(relationship, relationshipParams[2][0], relationshipParams[2][1]);
                }
                if (relationshipParams[0] === RelationshipType_1.RelationshipType.BELONGS_TO_MANY) {
                    const pivotName = relationshipParams[1][1];
                    const pivot = (0, ModelDecorator_1.getModelClass)(pivotName);
                    return this.belongsToMany(relationship, pivot, relationshipParams[2][0], relationshipParams[2][1]);
                }
                return new QueryBuilder_1.QueryBuilder(this);
            };
            this.relationships[key] = queryBuilder;
        });
        return this;
    }
    saveCollectionName() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = __1.DatabaseManager.get(this.dName);
            if (!db)
                return;
            yield new Promise((resolve) => {
                db.get(`Collections.${this.cName}`).catch(() => __awaiter(this, void 0, void 0, function* () {
                    yield db.put({
                        _id: `Collections.${this.cName}`,
                        name: this.cName,
                        className: this.getClass().name,
                    }).catch(() => {
                        resolve(true);
                    }).then(() => {
                        resolve(true);
                    });
                })).then(() => {
                    resolve(true);
                });
            });
        });
    }
    /**
     * Save a model into database
     * @returns this
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveCollectionName();
            let newAttributes = {};
            for (const field in this) {
                if (field === '_meta')
                    continue;
                if (field === 'relationships')
                    continue;
                if (field === 'needTimestamp')
                    continue;
                if (field === 'cName')
                    continue;
                if (this._meta._dirty && !this._meta._dirty[field] && !Array.isArray(this[field]))
                    continue;
                if (this[field] instanceof BaseModel)
                    continue;
                if (Array.isArray(this[field]) && this[field][0] instanceof BaseModel)
                    continue;
                newAttributes[field] = this[field];
            }
            newAttributes = (0, __1.convertIdFieldsToDocIds)(newAttributes, this);
            const now = (0, moment_1.default)().format();
            let updatedResult;
            let hasDocumentInDb;
            if (this.id) {
                if (this.multiDatabase) {
                    hasDocumentInDb = yield MultiQueryBuilder_1.MultiQueryBuilder.query(new (this.getClass())).find(this.id);
                }
                else {
                    hasDocumentInDb = yield this.getClass().query().find(this.id);
                }
            }
            // add static beforeSave function
            if (this.getClass().beforeSave) {
                yield this.getClass().beforeSave(this);
            }
            if (this.needTimestamp)
                newAttributes.updatedAt = now;
            if (!hasDocumentInDb) {
                if (this.needTimestamp)
                    newAttributes.createdAt = now;
                if (this.needTimestamp)
                    newAttributes.updatedAt = now;
                if (this.getClass().beforeCreate) {
                    yield this.getClass().beforeCreate(this);
                }
                if (this.multiDatabase) {
                    const currentPeriod = this._meta._period || (0, moment_1.default)().format('YYYY-MM');
                    updatedResult = yield MultiQueryBuilder_1.MultiQueryBuilder.query(new (this.getClass())).create(newAttributes, currentPeriod);
                    this._meta._period = currentPeriod;
                }
                else {
                    updatedResult = yield this.getClass().repo().create(newAttributes);
                }
                this.fill({ id: updatedResult.id, });
                if (this.getClass().afterCreate) {
                    yield this.getClass().afterCreate(this);
                }
            }
            else {
                const guarded = this.getClass().readonlyFields;
                if (guarded && guarded.length > 0) {
                    for (const field of guarded) {
                        delete newAttributes[field];
                        newAttributes[field] = this.getBeforeDirtyValue(field);
                    }
                }
                if (this.needTimestamp)
                    newAttributes.updatedAt = now;
                newAttributes.id = this.docId;
                if (this.getClass().beforeUpdate) {
                    yield this.getClass().beforeUpdate(this);
                }
                if (this.multiDatabase) {
                    updatedResult = yield MultiQueryBuilder_1.MultiQueryBuilder.query(new (this.getClass())).update(newAttributes, this._meta._period);
                }
                else {
                    updatedResult = yield this.getClass().repo().update(newAttributes);
                }
                if (this.getClass().afterCreate) {
                    yield this.getClass().afterCreate(this);
                }
            }
            delete newAttributes._rev;
            this.fill(Object.assign(Object.assign({}, newAttributes), { _rev: updatedResult.rev }));
            yield this.saveChildren();
            // add static afterSave function
            if (this.getClass().afterSave) {
                yield this.getClass().afterSave(this);
            }
            this.fill(Object.assign(Object.assign({}, newAttributes), { _rev: updatedResult.rev }));
            this.id = this.modelId;
            this.setForeignFieldsToModelId();
            if (!this.relationships)
                this.bindRelationships();
            this._meta._dirty = {};
            this._meta._before_dirty = {};
            return this;
        });
    }
    /**
     * Delete a model from database
     * @returns void
     */
    delete(forceDelete = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.getClass().beforeDelete) {
                yield this.getClass().beforeDelete(this);
            }
            if (this.getClass().softDelete && !forceDelete) {
                this.deletedAt = (0, moment_1.default)().format();
                yield this.save();
            }
            else {
                if (this.multiDatabase) {
                    const periodDbName = `${(0, MutliDatabaseConfig_1.getMainDatabaseName)()}-${this._meta._period}`;
                    yield QueryBuilder_1.QueryBuilder.query(this, undefined, periodDbName).setPeriod(this._meta._period).deleteOne(this.id);
                }
                else {
                    yield this.getClass().repo().deleteOne(this.id);
                }
                Object.keys(this).forEach((key) => delete this[key]);
            }
            if (this.getClass().afterDelete) {
                yield this.getClass().afterDelete(this);
            }
            // if (this.getClass().softDelete) {
            //     return this;
            // }
        });
    }
    /**
     * Remove a field from the model
     * @returns this
     */
    removeField(field) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this[field];
            this._meta._dirty[field] = true;
            return this.save();
        });
    }
    // end of CRUD operation
    // start of soft delete feature
    static withTrashed() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).withTrashed();
    }
    static onlyTrashed() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).onlyTrashed();
    }
    static withoutTrashed() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName).withoutTrashed();
    }
    restore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.needSoftDelete)
                throw new Error('This model does not support soft delete');
            delete this.deletedAt;
            const json = Object.assign(Object.assign({}, this.toJson()), { _id: this.docId, id: undefined, _rev: this._meta._rev });
            const db = __1.DatabaseManager.get(this.getClass().dbName);
            yield (db === null || db === void 0 ? void 0 : db.put(json));
            return this;
        });
    }
    // end of soft delete feature
    // start of query builder
    /**
     * Query for specific database
     * @param dbName database name that return from DatabaseManager.get()
     * @returns Model Query Builder with specific database
     */
    static via(dbName) {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, dbName);
    }
    /**
     * Query default database defined in the model
     * @returns Model Query Builder
     */
    static query() {
        return new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName);
    }
    static where(...args) {
        const query = new QueryBuilder_1.QueryBuilder(new this, undefined, this.dbName);
        // @ts-ignore
        return query.where(...args);
    }
    // end of query builder
    // start of relationship
    /**
     * Eager load relationships
     * @param relationships all relationships to load, support dot notation
     * @returns
     */
    static with(...relationships) {
        const model = new this;
        return new QueryBuilder_1.QueryBuilder(model, relationships, this.dbName);
    }
    /**
     * Load relationships to current model
     * @param relationships all relationships to load, support dot notation
     * @returns
     */
    load(...relationships) {
        return __awaiter(this, void 0, void 0, function* () {
            const klass = this.getClass();
            const newInstance = new klass();
            const builder = new QueryBuilder_1.QueryBuilder(newInstance, relationships, this.dName);
            builder.where('id', '=', this.id);
            const loadedModel = yield builder.first();
            for (const relationship of relationships) {
                this[relationship] = loadedModel[relationship];
            }
            return this;
        });
    }
    belongsTo(relationship, localKey, foreignKey) {
        return (0, BelongsTo_1.belongsTo)(this, relationship, localKey, foreignKey);
    }
    hasOne(relationship, localKey, foreignKey) {
        return (0, HasOne_1.hasOne)(this, relationship, localKey, foreignKey);
    }
    hasMany(relationship, localKey, foreignKey) {
        return (0, HasMany_1.hasMany)(this, relationship, localKey, foreignKey);
    }
    belongsToMany(relationship, pivot, localKey, foreignKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, BelongsToMany_1.belongsToMany)(this, relationship, pivot, localKey, foreignKey);
        });
    }
    // end of relationship
    // start api method
    /**
     * Call backend API method for the resource
     * @param apiPath Path name
     * @param params Parameters
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns
     */
    static api(apiPath, params, method = 'POST') {
        var _a;
        return (_a = this.repo().api) === null || _a === void 0 ? void 0 : _a.callApi(method, apiPath, params);
    }
    /**
     * Call backend API method for the resource with id
     * @param apiPath Path name
     * @param method 'GET' | 'POST' | 'PUT' | 'DELETE'
     * @returns
     */
    api(apiPath, method = 'POST') {
        var _a;
        return (_a = this.getClass().repo().api) === null || _a === void 0 ? void 0 : _a.callModelApi(method, apiPath, this.toJson());
    }
    // end api method
    // start of lifecycle
    static beforeSave(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static afterSave(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static beforeCreate(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static afterCreate(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static beforeUpdate(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static afterUpdate(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static beforeDelete(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    static afterDelete(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return model;
        });
    }
    // end of lifecycle
    /**
     * Convert model to a plain object
     * @returns javascript object
     */
    toJson() {
        const json = {};
        for (const field in this) {
            if (field === '_meta')
                continue;
            if (field === 'relationships')
                continue;
            if (field === 'needTimestamp')
                continue;
            if (field === 'cName')
                continue;
            if (this.relationships && Object.keys(this.relationships).includes(field))
                continue;
            json[field] = this[field];
        }
        return json;
    }
    // start transformer for api response 
    formatResponse(cloneSelf) {
        delete cloneSelf._meta;
        delete cloneSelf.relationships;
        return cloneSelf;
    }
    toResponse() {
        const replicatedModel = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete replicatedModel.save;
        for (const key in replicatedModel) {
            let formattedResult;
            if (Array.isArray(replicatedModel[key]) && replicatedModel[key][0] instanceof BaseModel) {
                formattedResult = replicatedModel[key].map(m => m.toResponse());
            }
            else if (replicatedModel[key] instanceof BaseModel) {
                formattedResult = replicatedModel[key].toResponse();
            }
            if (!formattedResult)
                continue;
            replicatedModel[key] = formattedResult;
        }
        if (this.formatResponse) {
            return this.formatResponse(replicatedModel);
        }
        if (!replicatedModel)
            throw new Error(`${this.getClass().name}.formatResponse() must return an object`);
        return replicatedModel;
    }
    // end transformer for api response
    // start dirty maintenance
    /**
     * Check if the model or attribute is dirty
     * @param attribute can be undefined, if undefined, check if the model is dirty, otherwise check if the attribute is dirty
     * @returns
     */
    isDirty(attribute) {
        if (attribute)
            return !!this._meta._dirty[attribute];
        // return this._meta._dirty whereas the boolean value is true
        return Object.keys(this._meta._dirty).some(key => this._meta._dirty[key]);
    }
    /**
     * Get the value of the attribute before it is dirty
     * @param attribute the attribute that which to check
     * @returns
     */
    getBeforeDirtyValue(attribute) {
        return this._meta._before_dirty[attribute];
    }
    /**
     * A method to check if this model is not the latest version with the database
     * @returns
     */
    isOutdated() {
        return (0, RealTimeModel_1.needToReload)(this, this.id);
    }
    notifyUpdate() {
        if (this._meta && this._meta._update_callbacks) {
            this._meta._update_callbacks.forEach(callback => callback());
        }
    }
    /**
     * Trigged when the model is being update in the database
     * @param callback
     */
    onChange(callback) {
        if (!this._meta._update_callbacks)
            this._meta._update_callbacks = [];
        this._meta._update_callbacks.push(callback);
    }
    // end dirty maintenance
    // start of join
    // TODO: add join methods
    isJoinField(field) {
        return false;
        // return this._join_fields[field] !== undefined;
    }
}
BaseModel.dbName = 'default';
BaseModel.readonlyFields = [];
BaseModel.timestamp = true;
BaseModel.softDelete = true;
BaseModel.multiDatabase = false;
exports.BaseModel = BaseModel;
exports.Model = BaseModel;
//# sourceMappingURL=Model.js.map