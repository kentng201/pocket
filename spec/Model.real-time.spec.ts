import { DatabaseManager } from 'src/manager/DatabaseManager';
import { setDocChangeEventListener, setRealtime } from 'src/real-time/RealTimeModel';
import { Model } from 'src/model/Model';
import { QueryBuilder } from 'src/index';

describe('Model Real Time', () => {
    class RealTimeUser extends Model {
        static dbName = 'real-time-model';
        static timestamp = undefined;

        name!: string;
        password?: string;

        setRandomPassword() {
            this.password = String(Math.random());
        }
    }

    class RealTimeUser2 extends Model {
        static dbName = 'real-time-model';
        static timestamp = undefined;

        name!: string;
        password?: string;
        posts?: RealTimePost[];

        relationships = {
            posts: () => this.hasMany(RealTimePost, 'id', 'userId'),
        } as {
            posts: () => QueryBuilder<RealTimePost>;
        };
    }

    class RealTimePost extends Model {
        static dbName = 'real-time-model';
        static timestamp = undefined;

        title!: string;
        userId!: string;
        content?: string;
        user?: RealTimeUser2;

        relationships = {
            user: () => this.belongsTo(RealTimeUser2, 'userId', 'id'),
        } as {
            user: () => QueryBuilder<RealTimeUser2>;
        };
    }

    beforeEach(async () => {
        await DatabaseManager.connect('real-time-model', { dbName: 'real-time-model', adapter: 'memory', silentConnect: true, });
    });

    it('should be real time synced when there is change', async () => {
        setRealtime(true);
        const originalUser = await RealTimeUser.create({
            id: 'real-time',
            name: 'Title-1',
        });
        const newUser = await RealTimeUser.find(originalUser.id) as RealTimeUser;
        newUser.name = 'Title-2';
        newUser.setRandomPassword();
        await newUser.save();
        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);

        originalUser.name = 'Title-3';
        await originalUser.save();
        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);

        const anotherUser = await RealTimeUser.find(newUser.id) as RealTimeUser;
        newUser.name = 'Title-4';
        await newUser.save();
        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);
        expect(newUser).toEqual(anotherUser);


        originalUser.name = 'Title-5';
        await originalUser.save();

        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);
        expect(newUser).toEqual(anotherUser);
    });

    it('should not have any real time listner when real time is disabled', async () => {
        setRealtime(false);
        const availableEvents = DatabaseManager.get('real-time-model')?.eventNames();
        expect(availableEvents?.length).toEqual(0);
    });

    it('should emit change event when real time is enabled', async () => {
        setDocChangeEventListener((id: string) => {
            if (id.includes('RealTimeUsers.ABC')) {
                expect(id).toEqual('RealTimeUsers.' + user.id);
            }
        });
        const user = await RealTimeUser.create({
            id: 'RealTimeUsers.ABC',
            name: 'Title-Testing-1',
        });
        user.name = 'Title-Testing-2';
        await user.save();
    });

    it('should able to verify the model is need to reload', async () => {
        setDocChangeEventListener((id: string) => {
            if (id.includes('RealTimePosts')) {
                const needReload = user.isOutdated(id);
                expect(needReload).toEqual(true);
            }
        });
        const user = await RealTimeUser2.create({
            id: 'test-123',
            name: 'Title-Testing-1',
            posts: [
                new RealTimePost({
                    id: 'RealTimePosts.ABC-1',
                    title: 'Title-Testing-1',
                }),
            ],
        }) as RealTimeUser2;
        await new Promise(res => setTimeout(res, 100));
    });
});