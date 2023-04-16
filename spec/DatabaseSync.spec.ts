import { Model } from 'src/index';
import { DatabaseManager } from '../src/manager/DatabaseManager';
import { syncDatabases } from 'src/real-time/DatabaseSync';


describe('DatabaseSync', () => {
    class DatabaseSyncTestUser extends Model {
        public static dbName = 'test';
        public static collectionName = 'SyncUsers';
        public username!: string;
    }

    class DatabaseSyncTest2User extends Model {
        public static dbName = 'test2';
        public static collectionName = 'SyncUsers';
        public username!: string;
    }

    it('should be able to sync a database', async () => {
        await DatabaseManager.connect('test', {
            dbName: 'test',
            adapter: 'memory',
            silentConnect: true,
        });
        await DatabaseManager.connect('test2', {
            dbName: 'test2',
            adapter: 'memory',
            silentConnect: true,
        });
        syncDatabases('test', 'test2');

        const user = await DatabaseSyncTestUser.create({
            _id: 'Test1',
            username: 'John',
        }) as DatabaseSyncTestUser;
        const user2 = await DatabaseSyncTest2User.find('Test1') as DatabaseSyncTestUser;
        expect(user._id).toEqual(user2._id);
        expect(user._rev).toEqual(user2._rev);
        expect(user.username).toEqual(user2.username);
    });
});