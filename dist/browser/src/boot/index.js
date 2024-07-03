var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DatabaseManager, setEnvironment } from '../manager/DatabaseManager';
import { setDefaultDbName, setDefaultNeedTimestamp } from '../model/Model';
import { setRealtime } from '../real-time/RealTimeModel';
import { syncDatabases } from '../real-time/DatabaseSync';
import { Persistor } from '../helpers/Persistor';
const isBrowser = typeof window !== 'undefined' && window.localStorage;
const CONFIG_IS_NULL_MSG = 'Config is null. Please provide a valid config object.';
export class ConfigPersistor extends Persistor {
}
export function replaceEnvVariable(config) {
    const env = typeof process !== 'undefined' ? process.env : {};
    const browserWindow = isBrowser ? window : {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                // @ts-ignore
                config[key] = element.replace(/\${(.*?)}/g, (match, p1) => env[p1]);
                // @ts-ignore
                config[key] = element.replace(/\${(.*?)}/g, (match, p1) => browserWindow[p1]);
            }
            else if (Array.isArray(element)) {
                config[key] = element.map((item) => {
                    return replaceEnvVariable(item);
                });
            }
            else if (typeof element === 'object') {
                config[key] = replaceEnvVariable(element);
            }
        }
    }
    return config;
}
export function setupConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config) {
            throw new Error(CONFIG_IS_NULL_MSG);
        }
        if (config.databases) {
            const tempDb = {};
            const multiConfig = config;
            setEnvironment(isBrowser ? 'browser' : 'node');
            setDefaultDbName(multiConfig.databases[0].dbName || 'default');
            setDefaultNeedTimestamp(multiConfig.modelTimestamp || false);
            for (const singleConfig of multiConfig.databases) {
                const dbName = singleConfig.dbName || 'default';
                yield DatabaseManager.connect(singleConfig.url, {
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
                }
                else {
                    if (tempDb['default'] && tempDb['default'] !== dbName) {
                        syncDatabases(tempDb['default'], dbName);
                    }
                    tempDb['default'] = dbName;
                }
            }
            setRealtime(multiConfig.realtimeUpdate || false);
        }
        else if (config.url) {
            const singleConfig = config;
            setEnvironment(isBrowser ? 'browser' : 'node');
            setDefaultDbName(singleConfig.dbName || 'default');
            setDefaultNeedTimestamp(singleConfig.modelTimestamp || false);
            yield DatabaseManager.connect(singleConfig.url, {
                dbName: singleConfig.dbName || 'default',
                password: singleConfig.password,
                adapter: singleConfig.adapter,
                silentConnect: singleConfig.silentConnect,
                auth: singleConfig.auth,
            });
            setRealtime(singleConfig.realtimeUpdate || false);
        }
    });
}
//# sourceMappingURL=index.js.map