/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
export declare function setEnvironment(environment: 'browser' | 'node'): void;
export declare const DEFAULT_DB_NAME = "default";
export type PouchDBConfig = {
    /**
     * Database name, which can be used in the DatabaseManager.get() method.
     * Default is 'default'.
     */
    dbName?: string;
    /**
     * Password to encrypt the database in your browser.
     * If not set, the database will not be encrypted.
     */
    password?: string;
    /**
     * Adapter to use. Default is 'idb' (IndexedDB) for the browser and 'leveldb' for NodeJS.
     * 'memory' | 'http' | 'idb' | 'leveldb' | 'websql'
     */
    adapter?: string;
    /**
     * If true, the connection will not be logged in the console.
     * Default is false.
     */
    silentConnect?: boolean;
    /**
     * Authentication for the online CouchDB.
     */
    auth?: {
        username: string;
        password: string;
    };
};
export type DatabaseCustomConfig = {
    adapter: string;
    transform: (transformer: {
        incoming: (doc: object) => object;
        outgoing: (doc: object) => object;
    }) => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    hasPassword: boolean;
    config: PouchDBConfig;
};
export declare class DatabaseManager {
    static databases: {
        [dbName: string]: PouchDB.Database & DatabaseCustomConfig | null;
    };
    static connect(url: string, config: PouchDBConfig): Promise<PouchDB.Database & DatabaseCustomConfig | null>;
    static get(dbName?: string): PouchDB.Database & DatabaseCustomConfig | null;
    static close(dbName?: string): void;
}
