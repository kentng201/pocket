import { onDocChange } from './real-time/RealTimeModel';
import { setEnvironment } from '.';
import { setRealtime } from '.';
import { getMainDatabaseName, getPerformanceMode, setMainDatabaseName, setPerformanceMode } from './multi-database/MutliDatabaseConfig';
export * from './manager/DatabaseManager';
export * from './manager/RepoManager';
export * from './model/Model';
export * from './query-builder/QueryBuilder';
export * from './real-time/RealTimeModel';
export * from './real-time/DatabaseSync';
export * from './relationships/RelationshipDecorator';
export * from './model/ModelDecorator';
export * from './helpers/Persistor';
export const PocketDefault = {
    setRealtime: setRealtime,
    setEnvironment: setEnvironment,
    onDocChange: onDocChange,
    setPerformanceMode: setPerformanceMode,
    getPerformanceMode: getPerformanceMode,
    setMainDatabaseName: setMainDatabaseName,
    getMainDatabaseName: getMainDatabaseName,
};
//# sourceMappingURL=index.js.map