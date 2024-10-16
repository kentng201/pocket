"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class MultipleDatabase {
    static createDatabase(period, remoteDatabaseCreation) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const mainDbName = this.dbName;
            const mainDbConfig = (_a = __1.DatabaseManager.databases[mainDbName]) === null || _a === void 0 ? void 0 : _a.config;
            if (!mainDbConfig)
                throw new Error(`Database ${mainDbName} not found`);
            const periodDbName = `${mainDbName}-${period}`;
            const periodDbConfig = {
                adapter: mainDbConfig.adapter,
                password: mainDbConfig.password,
                silentConnect: mainDbConfig.silentConnect,
                dbName: periodDbName,
            };
            let periodDb;
            try {
                periodDb = __1.DatabaseManager.get(periodDbName);
            }
            catch (error) {
                periodDb = null;
            }
            if (!periodDb) {
                periodDb = yield __1.DatabaseManager.connect(periodDbName, periodDbConfig);
                periodDb.config = periodDbConfig;
            }
            const remoteDbConfig = yield (remoteDatabaseCreation === null || remoteDatabaseCreation === void 0 ? void 0 : remoteDatabaseCreation(periodDbConfig));
            if ((remoteDbConfig === null || remoteDbConfig === void 0 ? void 0 : remoteDbConfig.dbName) && ((_b = periodDb === null || periodDb === void 0 ? void 0 : periodDb.config) === null || _b === void 0 ? void 0 : _b.dbName)) {
                yield __1.DatabaseManager.connect(remoteDbConfig.dbName, remoteDbConfig);
                (0, __1.syncDatabases)((_c = periodDb.config) === null || _c === void 0 ? void 0 : _c.dbName, remoteDbConfig.dbName);
            }
            const result = {
                name: mainDbName,
                period,
                localDatabaseName: `${mainDbName}-${period}`,
                config: periodDbConfig,
            };
            this.databases.push(result);
            return result;
        });
    }
    static getDatabase(period) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.databases.find(db => db.period === period);
        });
    }
}
MultipleDatabase.dbName = 'master'; // Main database name
// Store daily data like Transaction, Order, etc.
MultipleDatabase.databases = [];
exports.default = MultipleDatabase;
//# sourceMappingURL=MultiDatabase.js.map