import { DatabaseManager } from 'src/manager/DatabaseManager';

describe('Database Manager', () => {
    it('should be able to connect to database', async () => {
        await DatabaseManager.connect('database-manager', { dbName: 'database-manager', adapter: 'memory', silentConnect: true, });
        expect(DatabaseManager.get('database-manager')).toBeTruthy();
    });

    it('should throw an error if database not found', async () => {
        expect(() => DatabaseManager.get('database-manager2')).toThrowError('Database "database-manager2" not found.');
    });
});
