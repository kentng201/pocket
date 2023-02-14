import DatabaseManager from 'src/manager/DatabaseManager';
import Model from '../src/model/Model';

describe('Model', () => {
    class User extends Model {
        static dbName = 'test-model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('test-model', 'test-model');
    });
    afterAll(async () => {
        await DatabaseManager.get('test-model').destroy();
    });

    xit('should be able to create a new model', async () => {
        const user = await User.create({
            _id: 'new-user',
            name: 'new-user',
        });
        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _id: 'Users.new-user',
            _rev: jasmine.stringMatching('1-'),
            name: 'new-user',
        }));
    });

    it('should be able to find a model', async () => {
        const createdUser = await User.create({
            _id: 'new-user2',
            name: 'new-user2',
        });

        const user = await User.find('Users.new-user2');
        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _id: createdUser._id,
            _rev: createdUser._rev,
            name: createdUser.name,
        }));
    });
});