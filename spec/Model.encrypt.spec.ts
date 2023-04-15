import { DatabaseManager } from 'src/manager/DatabaseManager';
import { setRealtime } from 'src/real-time/RealTimeModel';
import { RepoManager } from 'src/manager/RepoManager';
import { Model } from 'src/model/Model';
import fs from 'fs';
import { QueryBuilder } from 'src/index';

const dbName = 'model-encrypt';

describe('Model Encrypt', () => {
    class EncryptUser extends Model {
        static dbName = dbName;
        static realtimeUpdate = true;

        name!: string;
        password?: string;

        getRandomPassword() {
            return Math.random().toString();
        }
    }
    let repo: QueryBuilder<EncryptUser>;


    beforeEach(async () => {
        await DatabaseManager.connect(dbName, {
            dbName,
            password: 'hu9fewu9bnf49n0*&(HG(',
            adapter: 'memory',
            silentConnect: true,
        });
        setRealtime(true);
        repo = RepoManager.get(new EncryptUser);
    });

    it('should be able to encrypt a database', async () => {
        repo.raw().changes({
            since: 'now',
            include_docs: true,
            live: true,
        }).on('change', function (change) {
            if (change.doc?._id === 'EncryptUsers.TestEncryptUser') {
                if (change.doc?._rev.includes('1-')) {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'EncryptUsers.TestEncryptUser',
                        name: 'John',
                    }));
                } else {
                    expect(change.doc).toEqual(jasmine.objectContaining({
                        _id: 'EncryptUsers.TestEncryptUser',
                        name: 'Jane',
                    }));
                }
            }
        });

        const user = await EncryptUser.create({
            _id: 'TestEncryptUser',
            name: 'John',
        });
        expect(user._id).toBe('EncryptUsers.TestEncryptUser');
        const anotherUser = await EncryptUser.find(user._id) as EncryptUser;
        user.name = 'Jane';
        await user.save();

        await new Promise((res) => setTimeout(res, 1000));
        expect(anotherUser).toEqual(user);

    });

    it('should able to generate 10 users and query with mango query when encrypted', async () => {
        await Promise.all(new Array(10).fill(0).map(
            () => EncryptUser.create({ name: 'Test' + Math.random(), })
        ));

        // test if mango query still workable when setup crypto pouch
        const users = await EncryptUser.query().where('name', '>', 'Test').get();
        expect(users.length).toBe(10);
    });

    it('should able to query all users when encrypted', async () => {
        const allUsers = await EncryptUser.all();
        expect(allUsers.length).toBe(11);

        const allUsersCount = await EncryptUser.count();
        expect(allUsersCount).toBe(11);
    });

    afterAll(() => {
        fs.rmSync('model-encrypt-encrypted', { recursive: true, force: true, });
    });
});