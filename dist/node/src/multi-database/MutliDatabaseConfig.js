"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainDatabaseName = exports.setMainDatabaseName = exports.getPerformanceMode = exports.setPerformanceMode = void 0;
const MultiDatabase_1 = __importDefault(require("./MultiDatabase"));
let performanceMode = false;
function setPerformanceMode(isPerformanceMode) {
    performanceMode = isPerformanceMode;
}
exports.setPerformanceMode = setPerformanceMode;
function getPerformanceMode() {
    return performanceMode;
}
exports.getPerformanceMode = getPerformanceMode;
function setMainDatabaseName(dbName) {
    MultiDatabase_1.default.dbName = dbName;
}
exports.setMainDatabaseName = setMainDatabaseName;
function getMainDatabaseName() {
    return MultiDatabase_1.default.dbName;
}
exports.getMainDatabaseName = getMainDatabaseName;
//# sourceMappingURL=MutliDatabaseConfig.js.map