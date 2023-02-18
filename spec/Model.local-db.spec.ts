import DatabaseManager from 'src/manager/DatabaseManager';
import Model from '../src/model/Model';

describe('Model Local DB', () => {
    class User extends Model {
        static dbName = 'local';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('local', 'local', 'memory');
    });

    it('should be able to find a model using query builder', async () => {
        const createdUser = await User.create({
            name: 'new-user2',
        });

        const userFromMangoQuery = await User.query().where('_id', '=', createdUser._id as string).first();
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