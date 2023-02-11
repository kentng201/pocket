import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import PouchDBAdapterMemory from 'pouchdb-adapter-memory';

PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBAdapterMemory);

export default class DatabaseManager {
    private static databases: { [dbName: string]: PouchDB.Database & {adapter: string;} };

    public static connect(url: string, dbName: string = 'default') {
        return new Promise((resolve, reject) => {
            try {
                const pouchDb = new PouchDB<{adapter: string;}>(url, { adapter: 'memory' }) as unknown as PouchDB.Database & {adapter: string};
                if (!this.databases) this.databases = {};
                this.databases[dbName] = pouchDb;
                console.log(`- Connected to PouchDB/CouchDB "${dbName}": ${url}`);
                console.log(`- Adapter: ${pouchDb.adapter}`);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    public static get(dbName?: string) {
        if (!dbName) {
            // find the only database
            if (Object.keys(this.databases).length === 1) {
                return this.databases[Object.keys(this.databases)[0]];
            }
            throw new Error(
                `PouchDB/CouchDB ${dbName} has not been initialized yet.`
            );
        }
        return this.databases[dbName];
    }
}
