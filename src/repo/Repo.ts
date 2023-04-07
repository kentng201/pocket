import uuid from 'short-uuid';
import { ModelType, NewModelType } from 'src/definitions/Model';
import { Model } from 'src/model/Model';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { APIResourceInfo } from 'src/manager/ApiHostManager';
import { ValidDotNotationArray } from 'src/definitions/DotNotation';

export class Repo<T extends Model, K extends string[] = []> extends QueryBuilder<T, K> {
    constructor(modelClass: T, relationships?: ValidDotNotationArray<T, K>, dbName?: string, isOne?: boolean, apiInfo?: APIResourceInfo) {
        super(modelClass, relationships, dbName, isOne, apiInfo);
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

    raw(): PouchDB.Database {
        return this.db;
    }
}