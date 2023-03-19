import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { Model } from 'src/model/Model';
import { DatabaseManager } from 'src/manager/DatabaseManager';

describe('QueryBuilder Basic', () => {
    class User extends Model {
        name!: string;
        password!: string;
    }

    beforeEach(async () => {
        await DatabaseManager.connect('test', { dbName: 'test', adapter: 'memory', silentConnect: true });
    });

    it('should create a query builder', () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        expect(queryBuilder).toBeTruthy();
    });

    it('should create a query builder with a where clause', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        await queryBuilder.where('name', '=', 'John');
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [
                    { name: { $eq: 'John' } },
                ]
            }
        });
    });

    it('should create a query builder with a where clause and a orWhere clause', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        await queryBuilder.where('name', '=', 'John').orWhere('name', '=', 'Jane');
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [{
                    $or: [
                        { name: { $eq: 'John' } },
                        { name: { $eq: 'Jane' } },
                    ]
                }],
            },
        });
    });

    it('should create a query build with multiple where clause by passing model object', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        queryBuilder.where({
            name: ['in', ['John', 'Jane']],
            password: 'qwer1234',
        });
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [
                    { name: { $in: ['John', 'Jane'] } },
                    { password: { $eq: 'qwer1234' } },
                ]
            }
        });
    });

    it('should create multiple or where by passing multuple or where clause', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        queryBuilder.orWhere('name', 'John').orWhere('password', '>=', 'qwer1234');
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [{
                    $or: [
                        { name: { $eq: 'John' } },
                        { password: { $gte: 'qwer1234' } },
                    ]
                }],
            },
        });
    });

    it('should create multiple or where by passing model object', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        queryBuilder.orWhere({ name: 'John', password: ['>=', 'qwer1234'] });
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [{
                    $or: [
                        { name: { $eq: 'John' } },
                        { password: { $gte: 'qwer1234' } },
                    ]
                }],
            },
        });
    });

    it('should create multiple or where by passing a function', async () => {
        const queryBuilder = new QueryBuilder(new User, undefined, 'test');
        queryBuilder.where('name', '=', 'John');
        queryBuilder.orWhere('password', '=', 'qwer1234');
        queryBuilder.orWhere('password', '=', 'qwer12345');
        queryBuilder.where('name', '=', 'Jane');
        queryBuilder.orWhere('password', '=', '24680');
        expect(queryBuilder.getQuery()).toEqual({
            selector: {
                $and: [{
                    $or: [
                        { name: { $eq: 'John' } },
                        { password: { $eq: 'qwer1234' } },
                        { password: { $eq: 'qwer12345' } },
                    ]
                }, {
                    $or: [
                        { name: { $eq: 'Jane' } },
                        { password: { $eq: '24680' } },
                    ]
                }],
            },
        });


    });
});