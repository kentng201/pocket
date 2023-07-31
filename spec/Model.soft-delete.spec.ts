import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from 'src/model/Model';

const dbName = 'model-soft-delete';

describe('Model Soft Delete', () => {
    class SoftUser extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName: dbName, adapter: 'memory', silentConnect: true, });
    });

    it('should be able to find a model using query builder', async () => {
        const user = await SoftUser.create({
            name: 'new-user2',
        });
        expect(user).toBeInstanceOf(SoftUser);
        expect(user.id).toBeDefined();
        expect(user.name).toBe('new-user2');
        await user.delete();
        const foundUser = await SoftUser.query().withTrashed().where('name', 'new-user2').first();
        expect(foundUser).toBeInstanceOf(SoftUser);

        const unfoundUser = await SoftUser.query().where('name', 'new-user2').first();
        expect(unfoundUser).toBeUndefined();
    });
});