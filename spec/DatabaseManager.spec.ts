import DatabaseManager from 'src/manager/DatabaseManager';

describe('Database Manager', () => {
    it('should be able to connect to database', async () => {
        await DatabaseManager.connect('database-manager', 'database-manager', 'memory');
        expect(DatabaseManager.get('database-manager')).toBeTruthy();
    });
});

