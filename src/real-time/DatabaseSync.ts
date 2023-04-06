import { DatabaseManager } from '..';

export function syncDatabases(...dbNames: string[]) {
    const databases = dbNames.map(dbName => DatabaseManager.get(dbName));
    let tempDb: PouchDB.Database;
    databases.forEach(db => {
        if (tempDb) {
            tempDb.sync(db, {
                live: true,
                retry: true,
            });
        }
        tempDb = db;
    });
}