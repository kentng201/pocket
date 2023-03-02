import { DatabaseManager } from 'src/manager/DatabaseManager';
import { Model } from '../src/model/Model';

describe('Model Local DB', () => {
    class User extends Model {
        static dbName = 'model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('model', { dbName: 'model', adapter: 'memory', silentConnect: true });
    });

    it('should be able to find a model using query builder', async () => {
        const createdUser = await User.create({
            name: 'new-user2',
        });

        const userFromMangoQuery = await User.query().where('_id', '=', createdUser._id as string).first();
        expect(userFromMangoQuery).toBeTruthy();
        expect(userFromMangoQuery).toEqual(createdUser);
    });
});