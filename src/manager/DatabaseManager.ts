import { isRealTime, setRealtime } from 'src/real-time/RealTimeModel';
import CryptoPouch from 'crypto-pouch';

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

export type PouchDBConfig = {
    dbName: string;
    password?: string;
    adapter?: string;
    silentConnect?: boolean;
}

export class DatabaseManager {
    public static databases: { [dbName: string]: PouchDB.Database } = {};

    public static async connect(url: string, config: PouchDBConfig = { dbName: 'default' }) {
        if (!PouchDB) {
            setEnvironement('node');
        }
        if (config.adapter == 'memory') {
            const PouchDBAdapterMemory = require('pouchdb-adapter-memory');
            PouchDB.plugin(PouchDBAdapterMemory);
        }
        if (isRealTime) {
            setRealtime(true);
        }
        PouchDB.plugin(CryptoPouch);
        return new Promise(async (resolve, reject) => {
            try {
                let pouchConfig = {} as {adapter: string;} | undefined;
                if (config.adapter) {
                    pouchConfig = {adapter: config.adapter};
                } else {
                    pouchConfig = undefined;
                }
                // @ts-ignore
                const pouchDb = new PouchDB<{adapter: string;}>(url, pouchConfig) as unknown as PouchDB.Database & {adapter: string};
                if (!this.databases) this.databases = {};
                this.databases[config.dbName] = pouchDb;
                
                if (!config.silentConnect) {
                    console.log(`- Connected to PouchDB/CouchDB "${config.dbName}": ${url}`);
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
