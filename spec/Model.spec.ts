import { DatabaseManager } from 'src/manager/DatabaseManager';
import { RepoManager } from 'src/manager/RepoManager';
import { Model } from 'src/model/Model';

describe('Model', () => {
    class User extends Model {
        static dbName = 'model';
        static readonlyFields = ['username',];

        name!: string;
        username?: string;
        password?: string;

        setRandomPassword() {
            this.password = Math.random().toString();
        }
    }

    beforeEach(async () => {
        await DatabaseManager.connect('model', { dbName: 'model', adapter: 'memory', silentConnect: true, });
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

        const user = await User.find(createdUser._id);

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

        const doc = await RepoManager.get(new User).getDoc(user._id) as User;
        expect(doc).toBeTruthy();
        expect(doc._dirty).not.toBeDefined();
        expect(doc.relationships).not.toBeDefined();
        expect(doc.setRandomPassword).not.toBeDefined();
    });

    it('should be able to delete a model', async () => {
        const user = await User.create({
            name: 'new-user5',
        });

        await user.delete();

        const deletedUser = await User.find(user._id as string);
        expect(deletedUser).not.toBeTruthy();
    });

    it('should be able to check if a attribute is dirty', () => {
        const user = new User;
        user.name = 'new-user6';
        const nameIsDirty = user.isDirty('name');
        expect(nameIsDirty).toEqual(true);

        const modelIsDirty = user.isDirty();
        expect(modelIsDirty).toEqual(true);
    });

    it('should only to set once for readonly field', async () => {
        const OLD_USERNAME = 'old-username';
        const NEW_USERNAME = 'new-username';

        const user = new User;
        user.username = OLD_USERNAME;
        user.name = 'new-user7';
        await user.save();

        user.username = NEW_USERNAME;
        await user.save();
        expect(user.username).toEqual(OLD_USERNAME);

        const dbUser = await User.find(user._id as string) as User;
        expect(dbUser.username).toEqual(OLD_USERNAME);
    });

    it('should be able to replicate a model without _id', async () => {
        const user = new User;
        user.name = 'new-user8';
        await user.save();

        const replicatedUser = user.replicate();
        replicatedUser.setRandomPassword();
        expect(replicatedUser).toEqual(jasmine.objectContaining({
            name: 'new-user8',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
        expect(replicatedUser._id).not.toBeDefined();
        expect(replicatedUser._rev).not.toBeDefined();
        expect(replicatedUser.password).toBeTruthy();
    });

    it('should be able to check the dirty record based on first time unsave edit', async () => {
        const user = new User;
        user.name = 'new-user9';
        await user.save();
        user.name = 'test1';
        user.name = 'test2';
        expect(user.getBeforeDirtyValue('name')).toEqual('new-user9');
    });
});