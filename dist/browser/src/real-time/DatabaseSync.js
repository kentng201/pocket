import { DatabaseManager } from '..';
const syncMap = new Map();
export function syncDatabases(...dbNames) {
    const databases = dbNames.map(dbName => DatabaseManager.get(dbName));
    let tempDb;
    // to cancel all previous syncs for prevent memory leak
    databases.forEach(db => {
        if (db) {
            const haveSync = syncMap.get(db.name);
            if (haveSync) {
                haveSync.cancel();
            }
        }
    });
    databases.forEach(db => {
        if (tempDb && db) {
            const sync = tempDb.sync(db, {
                live: true,
                retry: true,
            });
            syncMap.set(tempDb.name, sync);
            syncMap.set(db.name, sync);
        }
        if (db) {
            tempDb = db;
        }
    });
}
export function unsyncDatabases(...dbNames) {
    dbNames.forEach(dbName => {
        const sync = syncMap.get(dbName);
        if (sync) {
            sync.cancel();
        }
    });
}
//# sourceMappingURL=DatabaseSync.js.map