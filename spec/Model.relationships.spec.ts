import { DatabaseManager } from 'src/manager/DatabaseManager';
import { RepoManager } from 'src/manager/RepoManager';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { Model } from 'src/model/Model';

const dbName = 'model-relationships';

describe('Model Relationships', () => {
    class UserRelationship extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;

        posts?: PostRelationship[];
        employee?: Employee;

        relationships = {
            posts: () => this.hasMany(PostRelationship, '_id', 'userId'),
            employee: () => this.hasOne(Employee, '_id', 'userId'),
        } as {
            posts: () => QueryBuilder<PostRelationship>;
            employee: () => QueryBuilder<Employee>;
        };
    }

    class PostRelationship extends Model {
        static dbName = dbName;

        title!: string;
        userId!: string;
        content?: string;
        attachments?: Attachment[];
        relationships = {
            user: () => this.belongsTo(UserRelationship, '_id', 'userId'),
            attachments: () => this.hasMany(Attachment, '_id', 'postId'),
        } as {
            user: () => QueryBuilder<UserRelationship>;
            attachments: () => QueryBuilder<Attachment>;
        };
    }

    class Employee extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;
        userId!: string;

        user?: UserRelationship;
        relationships = {
            user: () => this.belongsTo(UserRelationship, '_id', 'userId'),
        } as {
            user: () => QueryBuilder<UserRelationship>;
        };
    }

    class Attachment extends Model {
        static dbName = dbName;

        name!: string;
        url!: string;
        postId!: string;
    }


    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName, adapter: 'memory', silentConnect: true, });
    });

    it('should be able to save without relationships', async () => {
        const user = await UserRelationship.create({
            name: 'John',
        });
        expect(user).toBeInstanceOf(UserRelationship);

        const post1 = await PostRelationship.create({ title: 'hello world', userId: user.docId, });
        const post2 = await PostRelationship.create({ title: 'nice to meet you, Malaysia', userId: user.docId, });

        await user.load('posts');
        expect(user.posts?.length).toBe(2);
        const posts = await user.relationships.posts().get();
        expect(posts.length).toBe(2);

        const posts2 = await PostRelationship.where('userId', user.docId).get();
        expect(posts2.length).toBe(2);

        const dbPost1Index = user.posts?.findIndex((p) => p._id === post1._id) as number;
        expect(user.posts?.[dbPost1Index]).toEqual(jasmine.objectContaining({
            _id: post1._id,
            _rev: post1._rev,
            title: post1.title,
            createdAt: post1.createdAt,
            updatedAt: post1.updatedAt,
        }));

        const dbPost2Index = user.posts?.findIndex((p) => p._id === post2._id) as number;
        expect(user.posts?.[dbPost2Index]).toEqual(jasmine.objectContaining({
            _id: post2._id,
            _rev: post2._rev,
            title: post2.title,
            createdAt: post2.createdAt,
            updatedAt: post2.updatedAt,
        }));
    });

    it('should not save relationship detail within the model', async () => {
        const user = await UserRelationship.create({ name: 'Jane', });
        await PostRelationship.create({ title: 'hello world', userId: user.docId, });
        await PostRelationship.create({ title: 'nice to meet you, Malaysia', userId: user.docId, });
        await user.load('posts');
        user.name = 'John';
        await user.save();

        const userCreated = await RepoManager.get(new UserRelationship).getDoc(user._id) as any;
        expect(userCreated).toEqual(jasmine.objectContaining({
            _id: user.docId,
            _rev: user._rev,
            name: user.name,
        }));
        expect(userCreated.posts).toBeUndefined();
    });

    it('should able to save sub-relationship', async () => {
        const user = await UserRelationship.create({ name: 'Jane', });
        await PostRelationship.create({ title: 'hello world', userId: user.docId, });
        await PostRelationship.create({ title: 'nice to meet you, Malaysia', userId: user.docId, });
        await user.load('posts');

        user.posts![0].title = 'Hi world';
        await user.posts![0].save();
        const postedUpdated = await RepoManager.get(new PostRelationship).getDoc(user.posts![0]._id);
        expect(postedUpdated).toEqual(jasmine.objectContaining({
            _id: user.posts![0].docId,
            _rev: user.posts![0]._rev,
            title: user.posts![0].title,
            createdAt: user.posts![0].createdAt,
            updatedAt: user.posts![0].updatedAt,
        }));
    });

    it('should able to load sub-relationship', async () => {
        const user = await UserRelationship.create({ name: 'Jane', });
        await PostRelationship.create({ title: 'hello world', userId: user.docId, });
        await PostRelationship.create({ title: 'nice to meet you, Malaysia', userId: user.docId, });
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

    it('should able to load multi level sub-relationship', async () => {
        const user = await UserRelationship.create({
            name: 'Hall', posts: [
                new PostRelationship({
                    title: 'hello world', attachments: [
                        new Attachment({ name: 'attachment 1', url: 'http://example.com/1', }),
                        new Attachment({ name: 'attachment 2', url: 'http://example.com/2', }),
                        new Attachment({ name: 'attachment 3', url: 'http://example.com/3', }),
                        new Attachment({ name: 'attachment 4', url: 'http://example.com/4', }),
                    ],
                }),
            ],
        });
        expect(user.posts?.length).toBe(1);

        const dbUser = await UserRelationship.with('posts', 'posts.attachments').find(user._id) as UserRelationship;
        dbUser.posts![0].attachments?.sort((a, b) => a.name.localeCompare(b.name));
        const dbPost = dbUser.posts![0];
        expect(dbPost.attachments?.length).toBe(4);
        expect(dbPost.attachments).toEqual((user.posts as PostRelationship[])[0].attachments);
    });

    it('should not query Employee when query PostRelationship from UserRelationship', async () => {
        const user = await UserRelationship.create({ name: 'John', });
        await PostRelationship.create({ title: 'hello world', userId: user.docId, });
        await PostRelationship.create({ title: 'nice to meet you, Malaysia', userId: user.docId, });
        await Employee.create({ name: 'John', userId: user.docId, });
        await user.load('posts');
        expect(user.posts?.length).toBe(2);
        const posts = await user.relationships.posts().get();
        expect(posts.length).toBe(2);
    });
});