import DatabaseManager from 'src/manager/DatabaseManager';
import Model from '../src/model/Model';

describe('Model Local DB', () => {
    class User extends Model {
        static dbName = 'test-model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('local', 'local');
    });

    it('should be able to find a model using query builder', async () => {
        const createdUser = await User.create({
            name: 'new-user2',
        });

        const userFromMangoQuery = await User.query().where('name', '=', createdUser.name as string).first();
        const user = await User.find(createdUser._id as string);
        console.log('user: ', user);
        expect(userFromMangoQuery).toBeTruthy();
        expect(userFromMangoQuery).toEqual(jasmine.objectContaining({
            _id: createdUser._id,
            _rev: createdUser._rev,
            name: createdUser.name,
            createdAt: createdUser.createdAt,
            updatedAt: createdUser.updatedAt,
        }));
    });
});