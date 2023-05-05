import { DatabaseManager } from '..';

export function syncDatabases(...dbNames: string[]) {
    const databases = dbNames.map(dbName => DatabaseManager.get(dbName));
    let tempDb: PouchDB.Database;
    databases.forEach(db => {
        if (tempDb && db) {
            tempDb.sync(db, {
                live: true,
                retry: true,
            });
        }
        if (db) {
            tempDb = db;
        }
    });
}