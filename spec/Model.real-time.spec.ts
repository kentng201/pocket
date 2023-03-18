import { DatabaseManager } from '../src/manager/DatabaseManager';
import { setRealtime } from '../src/real-time/RealTimeModel';
import { Model } from '../src/model/Model';

describe('Model Real Time', () => {
    class RealTimeUser extends Model {
        static dbName = 'real-time-model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('real-time-model', { dbName: 'real-time-model', adapter: 'memory', silentConnect: true, });
    });

    it('should be real time synced when there is change', async () => {
        setRealtime(true);
        const originalUser = await RealTimeUser.create({
            _id: 'real-time',
            name: 'Title-1',
        }) as RealTimeUser;
        const newUser = await RealTimeUser.find(originalUser._id) as RealTimeUser;
        newUser.name = 'Title-2';
        await newUser.save();
        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);

        originalUser.name = 'Title-3';
        await originalUser.save();
        await new Promise(res => setTimeout(res, 10)); // wait 10 milli-second for every module up-to-date
        expect(newUser).toEqual(originalUser);

        const anotherUser = await RealTimeUser.find(newUser._id) as RealTimeUser;
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
});