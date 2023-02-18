import DatabaseManager from 'src/manager/DatabaseManager';
import RepoManager from 'src/manager/RepoManager';
import Model from '../src/model/Model';

describe('Model', () => {
    class User extends Model {
        static dbName = 'model';

        name!: string;
        password?: string;

        getRandomPassword() {
            return Math.random().toString();
        }
    }

    beforeEach(async () => {
        await DatabaseManager.connect('model', 'model', 'memory');
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

    it('should be able to save a model', async () => {
        const user = new User;
        user.name = 'new-user3';
        user._id = 'new-user3';
        await user.save();


        const savedUser = await User.find(user._id as string);
        expect(savedUser).toBeTruthy();
        expect(savedUser).toBeInstanceOf(User);
        expect(savedUser).toEqual(user);
    });

    it('should not be save the meta data into database', async () => {
        const user = new User;
        user.name = 'new-user4';
        user._id = 'new-user4';
        await user.save();

        const doc = await RepoManager.get(new User).getDoc(user._id) as any;
        expect(doc).toBeTruthy();
        expect(doc._dirty).not.toBeDefined();
        expect(doc.relationships).not.toBeDefined();
        expect(doc.getRandomPassword).not.toBeDefined();
    });
});