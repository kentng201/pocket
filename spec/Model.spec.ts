import DatabaseManager from 'src/manager/DatabaseManager';
import Model from '../src/model/Model';

describe('Model', () => {
    class User extends Model {
        static dbName = 'test-model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('test-model', 'test-model', 'memory');
    });

    it('should be able to create a new model', async () => {
        const user = await User.create({
            name: 'new-user',
        });
        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _rev: jasmine.stringMatching('1-'),
            name: 'new-user',
        }));
    });

    it('should be able to find a model', async () => {
        const createdUser = await User.create({
            name: 'new-user2',
        });

        const user = await User.find(createdUser._id as string);

        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _id: createdUser._id,
            _rev: createdUser._rev,
            name: createdUser.name,
        }));
    });
});