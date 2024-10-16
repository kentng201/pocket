import { PouchDBConfig } from '..';
type MultiDatabaseConfig = {
    name: string;
    period: string;
    localDatabaseName: string;
    config: PouchDBConfig;
};
export default class MultipleDatabase {
    static dbName: string;
    static databases: MultiDatabaseConfig[];
    static createDatabase(period: string, remoteDatabaseCreation?: (periodDbConfig: PouchDBConfig) => PouchDBConfig | Promise<PouchDBConfig | undefined>): Promise<MultiDatabaseConfig>;
    static getDatabase(period: string): Promise<MultiDatabaseConfig | undefined>;
}
export {};
