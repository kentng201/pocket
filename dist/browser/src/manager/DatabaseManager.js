var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { setEncryptionPassword, transformer } from '../encryption/encryption';
import { isRealTime, setRealtime } from '../real-time/RealTimeModel';
let PouchDB;
export function setEnvironment(environment) {
    const PouchDBFind = require('pouchdb-find');
    if (environment == 'browser') {
        PouchDB = require('pouchdb-browser').default;
        PouchDB.plugin(PouchDBFind.default);
    }
    else {
        PouchDB = require('pouchdb');
        PouchDB.plugin(PouchDBFind);
    }
}
export const DEFAULT_DB_NAME = 'default';
class DatabaseManager {
    static connect(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!PouchDB) {
                setEnvironment('node');
            }
            if (config.adapter == 'memory') {
                const PouchDBAdapterMemory = require('pouchdb-adapter-memory');
                PouchDB.plugin(PouchDBAdapterMemory);
            }
            if (isRealTime) {
                setRealtime(true);
            }
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let pouchConfig = {};
                    if (config.adapter) {
                        pouchConfig = { adapter: config.adapter, };
                    }
                    if (config.auth) {
                        pouchConfig.skip_setup = true;
                    }
                    const pouchDb = new PouchDB(url, pouchConfig);
                    if (!config.silentConnect) {
                        console.log(`- Connected to PouchDB/CouchDB "${config.dbName}": ${url}`);
                        console.log(`- Adapter: ${pouchDb.adapter}`);
                    }
                    if (pouchDb.adapter == 'http' && config.auth) {
                        PouchDB.plugin(require('pouchdb-authentication'));
                        if (pouchDb.login) {
                            yield pouchDb.login(config.auth.username, config.auth.password);
                        }
                    }
                    if (config.password) {
                        pouchDb.hasPassword = true;
                        yield setEncryptionPassword(config.password, config.dbName || 'default');
                        PouchDB.plugin(require('transform-pouch'));
                        const newTransformer = Object.assign(Object.assign({}, transformer), { dbName: config.dbName || 'default' });
                        yield pouchDb.transform(newTransformer);
                    }
                    if (!this.databases)
                        this.databases = {};
                    if (!config.dbName) {
                        config.dbName = DEFAULT_DB_NAME;
                    }
                    pouchDb.config = config;
                    this.databases[config.dbName] = pouchDb;
                    resolve(pouchDb);
                }
                catch (error) {
                    console.error(`- Database "${config.dbName}" having error while connecting, please check below`);
                    console.error(error.message);
                    console.error(error.stack);
                    this.databases[config.dbName] = null;
                    resolve(null);
                }
            }));
        });
    }
    static get(dbName) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                return this.databases[Object.keys(this.databases)[0]];
            }
            if (Object.keys(this.databases).length === 0) {
                throw new Error('No database connected.');
            }
            throw new Error('There is more than one database connected. Please specify the database name to get.');
        }
        const db = this.databases[dbName];
        if (!db) {
            throw new Error(`Database "${dbName}" not found.`);
        }
        return db;
    }
    static close(dbName) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                dbName = Object.keys(this.databases)[0];
            }
            else if (Object.keys(this.databases).length === 0) {
                throw new Error('No database connected.');
            }
            else {
                throw new Error('There is more than one database connected. Please specify the database name to close.');
            }
        }
        const db = this.databases[dbName];
        if (db) {
            db.close();
            delete this.databases[dbName];
        }
    }
}
DatabaseManager.databases = {};
export { DatabaseManager };
//# sourceMappingURL=DatabaseManager.js.map