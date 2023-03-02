import { DatabaseManager } from 'src/manager/DatabaseManager';

describe('Database Manager', () => {
    it('should be able to connect to database', async () => {
        await DatabaseManager.connect('database-manager', { dbName: 'database-manager', adapter: 'memory', silentConnect: true });
        expect(DatabaseManager.get('database-manager')).toBeTruthy();
    });
});

