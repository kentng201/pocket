import { Model } from 'src/model/Model';
import { DatabaseManager } from 'src/manager/DatabaseManager';
import { RepoManager } from 'src/manager/RepoManager';
import { Repo } from 'src/repo/Repo';

describe('Repo', () => {
    class User extends Model {
        static dbName = 'repo-listen-change';

        name!: string;
        password?: string;
    }

    let repo: Repo<User>;

    beforeEach(async () => {
        await DatabaseManager.connect('test-repo-listen-change', { dbName: 'test-repo-listen-change', adapter: 'memory', silentConnect: true, });
        repo = RepoManager.get(new User);
    });

    it('should listen to change event and update the variable', async () => {
        repo.raw().changes({
            since: 'now',
            include_docs: true,
            live: true,
        }).on('change', function (change) {
            if (change.doc?._id === 'Users.TestListenChangeUser') {
                if (change.doc?._rev.includes('1-')) {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'Users.TestListenChangeUser',
                        name: 'John',
                    }));
                } else if (change.doc?._rev.includes('2-')) {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'Users.TestListenChangeUser',
                        name: 'John Doe',
                    }));
                }
            }
        });

        await repo.create({
            _id: 'TestListenChangeUser',
            name: 'John',
        });
        const document = await repo.getDoc('Users.TestListenChangeUser');
        await repo.update({ ...document, name: 'John Doe', });
        const docs = await repo.raw().allDocs({
            include_docs: true,
        });
        expect(docs).toBeTruthy();
        await new Promise((res) => setTimeout(res, 1000));
    });
});