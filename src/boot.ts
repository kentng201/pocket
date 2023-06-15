import { DatabaseManager, setEnvironement } from './manager/DatabaseManager';
import { setDefaultDbName, setDefaultNeedRealtimeUpdate, setDefaultNeedTimestamp } from './model/Model';
import { setRealtime } from './real-time/RealTimeModel';
import { syncDatabases } from './real-time/DatabaseSync';
import Persistor from './helpers/Persistor';
import getNodeConfig from './boot/node';
import getBrowserConfig from './boot/browser';

const isBrowser = typeof window !== 'undefined' && window.localStorage;
const isNode = typeof process !== 'undefined';

const FILE_NOT_FOUND_MSG = 'Cannot find pocket.config.json file. Please create one in the root of your project.';

export class ConfigPersistor extends Persistor {
}

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
            } else if (Array.isArray(element)) {
                config[key] = element.map((item) => {
                    return replaceEnvVariable(item);
                }) as any;
            } else if (typeof element === 'object') {
                config[key] = replaceEnvVariable(element);
            }
        }
    }
    return config;
}

async function setupConfig<Config extends SinglePocketConfig | MultiPocketConfig>(config: Config) {
    try {
        if ((config as MultiPocketConfig).databases) {
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
        } else if ((config as SinglePocketConfig).url) {
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
}

export const boot = async () => {
    let config;
    if (isBrowser) {
        config = await getBrowserConfig();
    }
    else if (isNode) {
        config = await getNodeConfig();
    }

    config = replaceEnvVariable(config);
    return setupConfig(config);
};