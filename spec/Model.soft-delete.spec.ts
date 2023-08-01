import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from 'src/model/Model';

const dbName = 'model-soft-delete';

describe('Model Soft Delete', () => {
    class SoftUser extends Model {
        static dbName = dbName;
        static softDelete = true;

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName: dbName, adapter: 'memory', silentConnect: true, });
    });

    it('should be able to find a model using trash feature', async () => {
        const user = await SoftUser.create({
            name: 'new-user2',
        });
        expect(user).toBeInstanceOf(SoftUser);
        expect(user.id).toBeDefined();
        expect(user.name).toBe('new-user2');
        await user.delete();
        const foundUser = await SoftUser.withTrashed().where('name', 'new-user2').first();
        expect(foundUser).toBeInstanceOf(SoftUser);
        expect(foundUser?.id).toBeDefined();
        expect(foundUser?.name).toBe('new-user2');

        const unfoundUser = await SoftUser.withoutTrashed().where('name', 'new-user2').first();
        expect(unfoundUser).toBeUndefined();

        const foundUser2 = await SoftUser.onlyTrashed().where('name', 'new-user2').first();
        expect(foundUser2).toBeInstanceOf(SoftUser);
        expect(foundUser2?.id).toBeDefined();
        expect(foundUser2?.name).toBe('new-user2');
    });

    it('should be able to restore a model', async () => {
        const user = await SoftUser.create({
            name: 'new-user2',
        });
        expect(user).toBeInstanceOf(SoftUser);
        expect(user.id).toBeDefined();
        expect(user.name).toBe('new-user2');
        await user.delete();
        const foundUser = await SoftUser.withTrashed().where('name', 'new-user2').first();
        expect(foundUser).toBeInstanceOf(SoftUser);
        expect(foundUser?.id).toBeDefined();
        expect(foundUser?.name).toBe('new-user2');
        await foundUser?.restore();
        console.log('SoftUser: ', await SoftUser.all());
        const restoredUser = await SoftUser.where('name', 'new-user2').first();
        console.log('restoredUser: ', restoredUser);
        expect(restoredUser).toBeInstanceOf(SoftUser);
        expect(restoredUser?.id).toBeDefined();
        expect(restoredUser?.name).toBe('new-user2');
    });
});