import DatabaseManager from 'src/manager/DatabaseManager';
import RepoManager from 'src/manager/RepoManager';
import Model from '../src/model/Model';

describe('Model', () => {
    class UserModel extends Model {
        static dbName = 'test-model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('test-model', 'test-model', 'memory');
    });

    it('should be able to create a new model', async () => {
        const user = await UserModel.create({
            name: 'new-user',
        });
        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _rev: jasmine.stringMatching('1-'),
            name: 'new-user',
        }));
    });

    it('should be able to find a model', async () => {
        const createdUser = await UserModel.create({
            name: 'new-user2',
        });

        const user = await UserModel.find(createdUser._id as string);

        expect(user).toBeTruthy();
        expect(user).toEqual(jasmine.objectContaining({
            _id: createdUser._id,
            _rev: createdUser._rev,
            name: createdUser.name,
        }));
    });

    it('should be able to save a model', async () => {
        const user = new UserModel;
        user.name = 'new-user3';
        user._id = 'new-user3';
        await user.save();


        const savedUser = await UserModel.find(user._id as string);
        expect(savedUser).toBeTruthy();
        expect(savedUser).toBeInstanceOf(UserModel);
        expect(savedUser).toEqual(jasmine.objectContaining({
            _id: user._id,
            _rev: user._rev,
            name: user.name,
        }));
    });

    it('should not be save the meta data into database', async () => {
        const user = new UserModel;
        user.name = 'new-user4';
        user._id = 'new-user4';
        await user.save();

        const doc = await RepoManager.get(new UserModel).getDoc(user._id) as any;
        expect(doc).toBeTruthy();
        expect(doc._dirty).not.toBeDefined();
        expect(doc.relationships).not.toBeDefined();
    });
});