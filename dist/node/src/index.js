"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocketDefault = void 0;
const RealTimeModel_1 = require("./real-time/RealTimeModel");
const _1 = require(".");
const _2 = require(".");
const MutliDatabaseConfig_1 = require("./multi-database/MutliDatabaseConfig");
__exportStar(require("./manager/DatabaseManager"), exports);
__exportStar(require("./manager/RepoManager"), exports);
__exportStar(require("./model/Model"), exports);
__exportStar(require("./query-builder/QueryBuilder"), exports);
__exportStar(require("./real-time/RealTimeModel"), exports);
__exportStar(require("./real-time/DatabaseSync"), exports);
__exportStar(require("./relationships/RelationshipDecorator"), exports);
__exportStar(require("./model/ModelDecorator"), exports);
__exportStar(require("./helpers/Persistor"), exports);
exports.PocketDefault = {
    setRealtime: _2.setRealtime,
    setEnvironment: _1.setEnvironment,
    onDocChange: RealTimeModel_1.onDocChange,
    setPerformanceMode: MutliDatabaseConfig_1.setPerformanceMode,
    getPerformanceMode: MutliDatabaseConfig_1.getPerformanceMode,
    setMainDatabaseName: MutliDatabaseConfig_1.setMainDatabaseName,
    getMainDatabaseName: MutliDatabaseConfig_1.getMainDatabaseName,
};
//# sourceMappingURL=index.js.map