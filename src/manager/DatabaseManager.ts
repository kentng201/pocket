import { isRealTime, setRealtime } from 'src/real-time/RealTimeModel';

let PouchDB: any;

export function setEnvironement(environement: 'browser' | 'node') {
    const PouchDBFind = require('pouchdb-find');
    if (environement == 'browser') {
        PouchDB = require('pouchdb-browser').default;
        PouchDB.plugin(PouchDBFind.default);
    } else {
        PouchDB = require('pouchdb');
        PouchDB.plugin(PouchDBFind);
    }
}

export class DatabaseManager {
    public static databases: { [dbName: string]: PouchDB.Database };

    public static connect(url: string, dbName: string = 'default', adapter?: string, silentConnect = true) {
        if (!PouchDB) {
            setEnvironement('node');
        }
        if (adapter == 'memory') {
            const PouchDBAdapterMemory = require('pouchdb-adapter-memory');
            PouchDB.plugin(PouchDBAdapterMemory);
        }
        if (isRealTime) {
            setRealtime(true);
        }
        return new Promise((resolve, reject) => {
            try {
                let config;
                if (adapter) {
                    config = {adapter};
                } else {
                    config = undefined;
                }
                // @ts-ignore
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
