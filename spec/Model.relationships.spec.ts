import DatabaseManager from 'src/manager/DatabaseManager';
import RepoManager from 'src/manager/RepoManager';
import QueryBuilder from 'src/query-builder/QueryBuilder';
import Model from '../src/model/Model';

const dbName = 'relationships-test';

describe('Model Relationships', () => {
    class UserRelationship extends Model {
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
            user: () => this.belongsTo(UserRelationship),
        } as {
            user: () => QueryBuilder<UserRelationship>;
        };
    }

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, dbName, 'memory');
    });
    
    it('should be able to save without relationships', async () => {
        const user = await UserRelationship.create({
            name: 'John',
        });
        expect(user).toBeInstanceOf(UserRelationship);

        const post1 = await Post.create({ title: 'hello world', userId: user._id });
        const post2 = await Post.create({ title: 'nice to meet you, Malaysia', userId: user._id });

        await user.load('posts');
        expect(user.posts?.length).toBe(2);
        const posts = await user.relationships.posts().get();
        expect(posts.length).toBe(2);

        const posts2 = await Post.where('userId', user._id).get();
        expect(posts2.length).toBe(2);

        const dbPost1Index = user.posts?.findIndex((p) => p._id === post1._id) as number;
        expect(user.posts?.[dbPost1Index]).toEqual(jasmine.objectContaining({
            _id: post1._id,
            title: post1.title,
        }));

        const dbPost2Index = user.posts?.findIndex((p) => p._id === post2._id) as number;
        expect(user.posts?.[dbPost2Index]).toEqual(jasmine.objectContaining({
            _id: post2._id,
            title: post2.title,
        }));
    });

    it('should not save relationship detail within the model', async () => {
        const user = await UserRelationship.create({ name: 'Jane' });
        await Post.create({ title: 'hello world', userId: user._id });
        await Post.create({ title: 'nice to meet you, Malaysia', userId: user._id });
        await user.load('posts');
        user.name = 'John';
        await user.save();

        const userCreated = await RepoManager.get(new UserRelationship).getDoc(user._id) as any;
        expect(userCreated).toEqual(jasmine.objectContaining({
            _id: user._id,
            _rev: user._rev,
            name: user.name,
        }));
        expect(userCreated.posts).toBeUndefined();
    });

    it('should able to save sub-relationship', async () => {
        const user = await UserRelationship.create({ name: 'Jane' });
        await Post.create({ title: 'hello world', userId: user._id });
        await Post.create({ title: 'nice to meet you, Malaysia', userId: user._id });
        await user.load('posts');

        user.posts![0].title = 'Hi world';
        await user.posts![0].save();
        const postedUpdated = await RepoManager.get(new Post).getDoc(user.posts![0]._id) as any;
        expect(postedUpdated).toEqual(jasmine.objectContaining({
            _id: user.posts![0]._id,
            _rev: user.posts![0]._rev,
            title: user.posts![0].title,
            createdAt: user.posts![0].createdAt,
            updatedAt: user.posts![0].updatedAt,
        }));
    });

    it('should able to load sub-relationship', async () => {
        const user = await UserRelationship.create({ name: 'Jane' });
        await Post.create({ title: 'hello world', userId: user._id });
        await Post.create({ title: 'nice to meet you, Malaysia', userId: user._id });
        const dbUser = await UserRelationship.with('posts').find(user._id);

        expect(dbUser?.posts?.length).toBe(2);
        expect(dbUser).toEqual(jasmine.objectContaining({
            _id: user._id,
            _rev: user._rev,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    });
});