import { Worker } from 'snowflake-uuid';
const generator = new Worker(0, 1, {
    workerIdBits: 5,
    datacenterIdBits: 5,
    sequenceBits: 12,
});

import { ModelKey, ModelType, NewModelType } from 'src/definitions/Model';
import Model from 'src/model/Model';
import QueryBuilder from 'src/query-builder/QueryBuilder';

export default class Repo<T extends Model> extends QueryBuilder<T> {
    constructor(modelClass: T, relationships?: ModelKey<T>[], dbName?: string, isOne?: boolean) {
        super(modelClass, relationships, dbName, isOne);
    }

    async getDoc(_id: string): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta> {
        return this.db.get(_id);
    }

    async create(attributes: NewModelType<T>): Promise<PouchDB.Core.Response> {
        if (!attributes._id) {
            attributes._id = String(generator.nextId());
        }
        attributes._id = `${this.modelClass.cName}.${attributes._id}`;
        return await this.db.post(attributes);
    }

    async update(attributes: Partial<ModelType<T>>): Promise<PouchDB.Core.Response> {
        const doc = await this.getDoc(attributes._id as string);
        return await this.db.put({...doc, ...attributes}, {
            force: false,
        });
    }

    async delete(_id: string): Promise<PouchDB.Core.Response> {
        const doc = await this.getDoc(_id);
        return await this.db.remove(doc);
    }

    raw() {
        return this.db;
    }
}