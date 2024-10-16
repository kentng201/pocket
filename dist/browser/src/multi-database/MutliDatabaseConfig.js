import MultipleDatabase from './MultiDatabase';
let performanceMode = false;
export function setPerformanceMode(isPerformanceMode) {
    performanceMode = isPerformanceMode;
}
export function getPerformanceMode() {
    return performanceMode;
}
export function setMainDatabaseName(dbName) {
    MultipleDatabase.dbName = dbName;
}
export function getMainDatabaseName() {
    return MultipleDatabase.dbName;
}
//# sourceMappingURL=MutliDatabaseConfig.js.map