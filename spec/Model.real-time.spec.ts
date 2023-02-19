import { DatabaseManager } from 'src/manager/DatabaseManager';
import { setRealtime } from 'src/real-time/RealTimeModel';
import { Model } from '../src/model/Model';

describe('Model Real Time', () => {
    class User extends Model {
        static dbName = 'model';

        name!: string;
        password?: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('model', 'model', 'memory');
        setRealtime(true);
    });

    it('should be real time synced when there is change', async () => {
        const originalUser = await User.create({
            _id: 'real-time',
            name: 'John',
        });
        const newUser = await User.find(originalUser._id);
        originalUser.name = 'Jane';
        await originalUser.save();
        // expect(newUser).toEqual(originalUser);
    });
});