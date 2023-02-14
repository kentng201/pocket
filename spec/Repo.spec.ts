import Model from '../src/model/Model';
import DatabaseManager from 'src/manager/DatabaseManager';
import RepoManager from 'src/manager/RepoManager';
import Repo from 'src/repo/Repo';

describe('Repo', () => {
    class User extends Model {
        static dbName = 'repo';

        name!: string;
        password?: string;
    }

    let repo: Repo<User>;

    beforeEach(async () => {
        await DatabaseManager.connect('repo', 'repo', 'memory');
        repo = RepoManager.get(new User);
    });

    it('should be able to create document via repo', async () => {
        const result = await repo.create({
            _id: 'User1',
            name: 'John',
        });
        expect(result).toEqual(jasmine.objectContaining({
            ok: true,
            id: 'Users.User1',
        }));

        const doc = await repo.getDoc('Users.User1');
        expect(doc).toEqual(jasmine.objectContaining({
            _id: 'Users.User1',
            name: 'John',
        }));
    });

    it('should be able to update document via repo', async () => {
        await repo.create({
            _id: 'User2',
            name: 'Jane',
        });
        const doc = await repo.getDoc('Users.User2');
        expect(doc).toEqual(jasmine.objectContaining({
            _id: 'Users.User2',
            name: 'Jane',
        }));
        const result = await repo.update({...doc, name: 'Jack'});
        expect(result).toEqual(jasmine.objectContaining({
            ok: true,
            id: 'Users.User2',
        }));

        const updatedDoc = await repo.getDoc('Users.User2');
        expect(updatedDoc).toEqual(jasmine.objectContaining({
            _id: 'Users.User2',
            name: 'Jack',
        }));
    });

    it('should be able to delete document via repo', async () => {
        await repo.create({
            _id: 'User3',
            name: 'John',
        });
        const doc = await repo.getDoc('Users.User3');
        expect(doc).toEqual(jasmine.objectContaining({
            _id: 'Users.User3',
            name: 'John',
        }));
        const result = await repo.delete('Users.User3');
        expect(result).toEqual(jasmine.objectContaining({
            ok: true,
            id: 'Users.User3',
        }));

        try {
            await repo.getDoc('Users.User3');
        } catch (e) {
            expect(e).toEqual(jasmine.objectContaining({
                status: 404,
            }));
        }
    });
});