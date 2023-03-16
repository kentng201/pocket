import { DatabaseManager } from '../src/manager/DatabaseManager';
import { ApiHostManager } from '../src/manager/ApiHostManager';
import { APIAutoConfig } from '../src/definitions/APIAutoConfig';
import { server } from '../mocks/server';
import { Model } from '../src/model/Model';

const dbName = 'model-api';

describe('Model API', () => {
    class ApiUser extends Model {
        static dbName = dbName;
        static apiName = 'default';
        static apiResource = 'users';
        static apiAuto = {
            create: true,
            update: true,
            delete: false,
            softDelete: false,
            fetchWhenMissing: true,
        } as APIAutoConfig;

        name!: string;
        password?: string;

        async setRandomPassword() {
            const result = await this.api('random-password');
            this.fill(result);
        }
    }

    beforeAll(() => {
        server.listen();
    });

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName, adapter: 'memory', silentConnect: true, });
        ApiHostManager.addHost('http://pocket.test');
    });

    afterAll(async () => {
        server.close();
    });

    it('should be able to create a model with API', async () => {
        const user = await ApiUser.create({
            name: 'John',
        });
        expect(user).toBeTruthy();
        expect(user).toBeInstanceOf(ApiUser);
    });

    it('should be able to update a model with API', async () => {
        const user = await ApiUser.create<ApiUser>({
            name: 'Jane',
        });
        await user.update({
            name: 'John',
        });
        expect(user.name).toBe('John');
    });

    it('should be able to delete a model without call API, and should be able to fetch a fallback model with call API', async () => {
        const user = await ApiUser.create<ApiUser>({
            name: 'John',
        });
        const id = user._id;
        await user.delete();

        const userFallback = await ApiUser.find<ApiUser>(id);
        expect(userFallback).toBeTruthy();
        expect(userFallback?._fallback_api_doc).toBe(true);

        const userFallbackRefetch = await ApiUser.find<ApiUser>(id);
        expect(userFallbackRefetch).toBeTruthy();
        expect(userFallbackRefetch?._fallback_api_doc).toBe(false);
    });

    it('should be able to run backend function with API', async () => {
        const user = await ApiUser.create<ApiUser>({
            name: 'John',
        });
        await user.setRandomPassword();
        expect(user.password).toBeTruthy();
        expect(user.password).toBe('random');
    });
});
