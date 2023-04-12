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

export const DEFAULT_DB_NAME = 'default';

export type PouchDBConfig = {
    dbName?: string;
    password?: string;
    adapter?: string;
    silentConnect?: boolean;
    auth?: {
        username: string;
        password: string;
    };
};

export class DatabaseManager {
    public static databases: { [dbName: string]: PouchDB.Database } = {};

    public static async connect(url: string, config: PouchDBConfig) {
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
        if (config.password) {
            PouchDB.plugin(require('comdb'))
        }
        return new Promise(async (resolve) => {
            let pouchConfig = {} as { adapter: string; auth?: { username: string; password: string; }; };
            if (config.adapter) {
                pouchConfig = { adapter: config.adapter, };
            }
            if (config.auth) {
                pouchConfig.auth = config.auth;
            }
            const pouchDb = new PouchDB(url, pouchConfig) as unknown as PouchDB.Database & { adapter: string };
            if (config.password) {
                await (pouchDb as any).setPassword(config.password);
            }

            if (!this.databases) this.databases = {};
            if (!config.dbName) {
                config.dbName = DEFAULT_DB_NAME;
            }
            this.databases[config.dbName] = pouchDb;

            if (!config.silentConnect) {
                console.log(`- Connected to PouchDB/CouchDB "${config.dbName}": ${url}`);
                console.log(`- Adapter: ${pouchDb.adapter}`);
            }
            resolve(true);

        });
    }

    public static get(dbName?: string) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                return this.databases[Object.keys(this.databases)[0]];
            }
            if (Object.keys(this.databases).length === 0) {
                throw new Error('No database connected.');
            }
            throw new Error(
                'There is more than one database connected. Please specify the database name to get.'
            );
        }
        const db = this.databases[dbName];
        if (!db) {
            throw new Error(`Database "${dbName}" not found.`);
        }
        return db;
    }

    public static close(dbName?: string) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                dbName = Object.keys(this.databases)[0];
            } else if (Object.keys(this.databases).length === 0) {
                throw new Error('No database connected.');
            } else {
                throw new Error(
                    'There is more than one database connected. Please specify the database name to close.'
                );
            }
        }
        const db = this.databases[dbName];
        if (db) {
            db.close();
            delete this.databases[dbName];
        }
    }
}
