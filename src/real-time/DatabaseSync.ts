import { DatabaseCustomConfig, DatabaseManager } from '..';


export function syncDatabases(...dbNames: string[]) {
    const databases = dbNames.map(dbName => DatabaseManager.get(dbName));
    let tempDb: PouchDB.Database & DatabaseCustomConfig;
    databases.forEach(db => {
        if (tempDb && db) {
            if (tempDb.password) {
                tempDb
                    .changes({
                        since: 'now',
                        include_docs: true,
                        live: true,
                    })
                    .on('change', async (info: PouchDB.Core.ChangesResponseChange<any>) => {
                        try {
                            const doc = info.doc;
                            console.log('doc: ', doc);
                            if (doc._id && doc._rev && Object.keys(doc).length == 2) {
                                // deleted doc
                                return;
                            }
                            await db.get(doc._id).then(async (result) => {
                                if (result && result._rev) {
                                    const newDoc = { ...doc, _rev: result._rev, };
                                    await db.put(newDoc);
                                }
                            }).catch(async () => {
                                await db.put({ ...doc, _rev: undefined, });
                            });
                        } catch (err) {
                            console.log('err: ', err);
                        }
                    });
            } else {
                console.log('goes else');
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