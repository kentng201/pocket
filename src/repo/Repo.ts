import uuid from 'short-uuid';
import axios from 'axios';
import { ModelKey, ModelType, NewModelType } from 'src/definitions/Model';
import { Model } from 'src/model/Model';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { APIResourceInfo } from 'src/manager/ApiHostManager';

export class Repo<T extends Model> extends QueryBuilder<T> {

    constructor(modelClass: T, relationships?: ModelKey<T>[], dbName?: string, isOne?: boolean, apiInfo?: APIResourceInfo) {
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
                _id = _id.includes('.') ? _id.split('.')[1] : _id;
                const createdItem = await this.create({...result, _id} as NewModelType<T>, true);
                result._fallback_api_doc = true;
                result._rev = createdItem.rev;
                result._id = createdItem.id;
                return result;
            }
        }
    }

    async create(attributes: NewModelType<T>, fallbackCreate = false): Promise<PouchDB.Core.Response> {
        if (!attributes._id) {
            attributes._id = String(uuid.generate());
        }
        attributes._id = `${this.modelClass.cName}.${attributes._id}`;
        const result = await this.db.post(attributes);
        if (this.apiInfo && this.apiInfo.apiAutoCreate && !fallbackCreate) {
            await this.api?.create(attributes);
        }
        return result;
    }

    async update(attributes: Partial<ModelType<T>>): Promise<PouchDB.Core.Response> {
        const doc = await this.getDoc(attributes._id as string);
        const result = await this.db.put({...doc, ...attributes}, {
            force: false,
        });
        if (this.apiInfo && this.apiInfo.apiAutoUpdate) {
            await this.api?.update({...doc, ...attributes});
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
        return result;
    }

    raw() {
        return this.db;
    }
}