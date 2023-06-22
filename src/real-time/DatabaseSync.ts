import { DatabaseCustomConfig, DatabaseManager } from '..';

export function syncDatabases(...dbNames: string[]) {
    const databases = dbNames.map(dbName => DatabaseManager.get(dbName));
    let tempDb: PouchDB.Database & DatabaseCustomConfig;
    databases.forEach(db => {
        if (tempDb && db) {
            if (db.password) {
                db.changes({
                    since: 'now',
                    include_docs: true,
                    live: true,
                }).on('change', async (info: any) => {
                    const doc = await db.get(info.id);
                    try {
                        const result = await tempDb.get(doc._id);
                        if (result && result._rev) {
                            const newDoc = { ...doc, _rev: result._rev, };
                            await tempDb.put(newDoc);
                        }
                    } catch (err) {
                        await tempDb.put({ ...doc, _rev: undefined, });
                    }
                });
            } else {
                tempDb.sync(db, {
                    live: true,
                    retry: true,
                });
            }
        }
        if (db) {
            tempDb = db;
        }
    });
}