import { DatabaseManager } from 'src/manager/DatabaseManager';
import { setRealtime } from 'src/real-time/RealTimeModel';
import { Model } from 'src/model/Model';

describe('Model Not Real Time', () => {
    class NotRealTimeUser extends Model {
        static dbName = 'no-real-time-model';
        static realtimeUpdate = false;

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('no-real-time-model', { dbName: 'no-real-time-model', adapter: 'memory', silentConnect: true, });
    });

    it('should be real time synced when there is change', async () => {
        setRealtime(true);
        const originalUser = await NotRealTimeUser.create<NotRealTimeUser>({
            _id: 'real-time',
            name: 'Title-1',
        });
        const fetchedUser = await NotRealTimeUser.find(originalUser._id) as NotRealTimeUser;
        originalUser.name = 'Title-2';
        await originalUser.save();
        await new Promise(res => setTimeout(res, 100)); // wait 10 milli-second for every module up-to-date
        expect(fetchedUser).not.toEqual(originalUser);
        expect(fetchedUser.name).not.toBeUndefined();
        expect(fetchedUser.name).not.toBeNull();
    });
});