import { setEnvironment } from '.';
import { setRealtime } from '.';
export * from './manager/DatabaseManager';
export * from './manager/RepoManager';
export * from './model/Model';
export * from './query-builder/QueryBuilder';
export * from './real-time/RealTimeModel';
export * from './real-time/DatabaseSync';
export * from './relationships/RelationshipDecorator';
export * from './model/ModelDecorator';
export * from './helpers/Persistor';
export declare const PocketDefault: {
    setRealtime: typeof setRealtime;
    setEnvironment: typeof setEnvironment;
};
