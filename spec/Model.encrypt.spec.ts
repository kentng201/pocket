import { DatabaseManager } from '../src/manager/DatabaseManager';
import { RepoManager } from '../src/manager/RepoManager';
import { Repo } from '../src/repo/Repo';
import { Model } from '../src/model/Model';

const dbName = 'model-encrypt';

describe('Model Encrypt', () => {
    class EncryptUser extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;

        getRandomPassword() {
            return Math.random().toString();
        }
    }
    let repo: Repo<EncryptUser>;


    beforeEach(async () => {
        await DatabaseManager.connect(dbName, {
            dbName,
            password: 'hu9fewu9bnf49n0*&(HG(',
            adapter: 'memory',
            silentConnect: true,
        });
        repo = RepoManager.get(new EncryptUser);
    });

    it('should be able to encrypt a database', async () => {
        repo.raw().changes({
            since: 'now',
            include_docs: true,
            live: true,
        }).on('change', function (change) {
            if (change.doc?._id === 'Users.TestEncryptUser') {
                if (change.doc?._rev.includes('1-')) {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'Users.TestEncryptUser',
                        name: 'John',
                    }));
                } else {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'Users.TestEncryptUser',
                        name: 'Jane',
                    }));
                }
            }
        });

        const user = await EncryptUser.create({
            _id: 'TestEncryptUser',
            name: 'John',
        }) as EncryptUser;
        user.name = 'Jane';
        await user.save();
        await new Promise((res) => setTimeout(res, 1000));
        const savedUser = await EncryptUser.find(user._id);
        expect(savedUser).toEqual(user);

        // generate random 10 users
        await Promise.all(new Array(10).fill(0).map(
            () => EncryptUser.create({ name: 'Test' + Math.random(), })
        ));

        // test if mango query still workable when setup crypto pouch
        const users = await EncryptUser.query().where('name', '>', 'Test').get();
        expect(users.length).toBe(10);
    });
});