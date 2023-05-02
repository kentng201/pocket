import { DatabaseManager, setEnvironement } from './manager/DatabaseManager';
import { setDefaultDbName, setDefaultNeedRealtimeUpdate, setDefaultNeedTimestamp } from './model/Model';
import { setRealtime } from './real-time/RealTimeModel';
import { syncDatabases } from './real-time/DatabaseSync';

type SinglePocketConfig = {

    /**
     * url of the CouchDB/PouchDB server.
     */
    url: string;
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

    /**
     * Name of the sync databases set you wish to sync with.
     * e.g. if you have 2 databases, both set `syncSetName` to "mySyncSet", then they will be synced.
     */
    syncSetName?: string;
};

type MultiPocketConfig = {
    databases: SinglePocketConfig[];

};

type GlobalConfig = {
    /**
     * If true, the model will have createdAt and updatedAt fields.
     */
    modelTimestamp?: boolean;


    /**
     * If true, the runtime variable will be updated when the database is updated.
     */
    realtimeUpdate?: boolean;
};

let configFilePath = process.cwd() + '/pocket.config.json';

const isBrowser = typeof window !== 'undefined' && window.localStorage;
const isNode = typeof process !== 'undefined';

const FILE_NOT_FOUND_MSG = 'Cannot find pocket.config.json file. Please create one in the root of your project.';

function replaceEnvVariable<Config extends SinglePocketConfig | MultiPocketConfig>(config: Config): Config {
    const env = process.env;
    const browserWindow = isBrowser ? window : {};

    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key as keyof typeof config] as string | Array<MultiPocketConfig>;
            if (typeof element === 'string') {
                // @ts-ignore
                config[key] = element.replace(/\${(.*?)}/g, (match, p1) => env[p1]);
                // @ts-ignore
                config[key] = element.replace(/\${(.*?)}/g, (match, p1) => browserWindow[p1]);
            }
            else if (Array.isArray(element)) {
                config[key] = element.map((item) => {
                    return replaceEnvVariable(item);
                }) as any;
            }
        }
    }
    return config;
}

export const boot = async () => {
    let config;
    if (isBrowser) {
        configFilePath = 'pocket.config.json';
        try {
            const file = await fetch(configFilePath);
            const result = await file.text();
            config = JSON.parse(result);
        } catch (error) {
            throw new Error(FILE_NOT_FOUND_MSG);
        }
    }
    else if (isNode) {
        configFilePath = process.cwd() + '/pocket.config.json';
        const fs = require('fs');
        const file = fs.readFileSync(configFilePath, 'utf8');
        config = JSON.parse(file);
    }


    config = replaceEnvVariable(config);

    try {
        if (config.databases) {
            const tempDb: any = {};

            const multiConfig = config as MultiPocketConfig & GlobalConfig;
            setEnvironement(isBrowser ? 'browser' : 'node');
            setDefaultDbName(multiConfig.databases[0].dbName || 'default');
            setDefaultNeedTimestamp(multiConfig.modelTimestamp || false);
            setDefaultNeedRealtimeUpdate(multiConfig.realtimeUpdate || false);
            for (const singleConfig of multiConfig.databases) {
                const dbName = singleConfig.dbName || 'default';
                await DatabaseManager.connect(singleConfig.url, {
                    dbName,
                    password: singleConfig.password,
                    adapter: singleConfig.adapter,
                    silentConnect: singleConfig.silentConnect,
                    auth: singleConfig.auth,
                });
                if (singleConfig.syncSetName) {
                    if (tempDb[singleConfig.syncSetName] && tempDb[singleConfig.syncSetName] !== dbName) {
                        syncDatabases(tempDb[singleConfig.syncSetName], dbName);
                    }
                    tempDb[singleConfig.syncSetName] = dbName;
                } else {
                    if (tempDb['default'] && tempDb['default'] !== dbName) {
                        syncDatabases(tempDb['default'], dbName);
                    }
                    tempDb['default'] = dbName;
                }
            }
            setRealtime(multiConfig.realtimeUpdate || false);
        } else if (config.url) {
            const singleConfig = config as SinglePocketConfig & GlobalConfig;
            setEnvironement(isBrowser ? 'browser' : 'node');
            setDefaultDbName(singleConfig.dbName || 'default');
            setDefaultNeedTimestamp(singleConfig.modelTimestamp || false);
            setDefaultNeedRealtimeUpdate(singleConfig.realtimeUpdate || false);
            await DatabaseManager.connect(singleConfig.url, {
                dbName: singleConfig.dbName || 'default',
                password: singleConfig.password,
                adapter: singleConfig.adapter,
                silentConnect: singleConfig.silentConnect,
                auth: singleConfig.auth,
            });
            setRealtime(singleConfig.realtimeUpdate || false);
        }
    } catch (error) {
        throw new Error(FILE_NOT_FOUND_MSG);
    }
};