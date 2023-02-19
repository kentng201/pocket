import PouchDBFind from 'pouchdb-find';
import PouchDBAdapterMemory from 'pouchdb-adapter-memory';

// @ts-ignore
let PouchDB: PouchDB = require('pouchdb');
export function setEnvironement(environement: 'browser' | 'node') {
    if (environement == 'browser') {
        PouchDB = require('pouchdb-browser');
        PouchDB.plugin(PouchDBFind);
    } else {
        PouchDB = require('pouchdb');
        PouchDB.plugin(PouchDBFind);
        PouchDB.plugin(PouchDBAdapterMemory);
    }
}
setEnvironement('node');

export class DatabaseManager {
    private static databases: { [dbName: string]: PouchDB.Database };

    public static connect(url: string, dbName: string = 'default', adapter?: string, silentConnect = true) {
        return new Promise((resolve, reject) => {
            try {
                let config;
                if (adapter) {
                    config = {adapter};
                } else {
                    config = undefined;
                }
                const pouchDb = new PouchDB<{adapter: string;}>(url, config) as unknown as PouchDB.Database & {adapter: string};
                if (!this.databases) this.databases = {};
                this.databases[dbName] = pouchDb;
                
                if (!silentConnect) {
                    console.log(`- Connected to PouchDB/CouchDB "${dbName}": ${url}`);
                    console.log(`- Adapter: ${pouchDb.adapter}`);
                }
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    public static get(dbName?: string) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                return this.databases[Object.keys(this.databases)[0]];
            }
            throw new Error(
                'There is more than one database connected. Please specify the database name.'
            );
        }
        return this.databases[dbName];
    }
}
