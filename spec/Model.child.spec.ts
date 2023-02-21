import { DatabaseManager } from 'src/manager/DatabaseManager';
import { RepoManager } from 'src/manager/RepoManager';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { Model } from '../src/model/Model';

const dbName = 'model';

describe('Model Child', () => {
    class User extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;

        posts?: Post[];

        relationships = {
            posts: () => this.hasMany(Post, '_id', 'userId'),
        } as {
            posts: () => QueryBuilder<Post>;
        };
    }

    class Post extends Model {
        static dbName = dbName;

        title!: string;
        userId!: string;
        content?: string;
        relationships = {
            user: () => this.belongsTo(User),
        } as {
            user: () => QueryBuilder<User>;
        };
    }

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, 'memory', dbName);
    });

    it('should be able to save with relationships', async () => {
        const user = await User.create({
            name: 'John',
            posts: [
                new Post({ title: 'hello world' }),
                new Post({ title: 'hi world' }),
            ]
        });
        expect(user).toBeInstanceOf(User);
        console.log('user: ', user);
    });
});