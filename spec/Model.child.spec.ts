import { DatabaseManager } from 'src/manager/DatabaseManager';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';
import { Model } from '../src/model/Model';

const dbName = 'model';

describe('Model Child', () => {
    class User extends Model {
        static dbName = dbName;

        name!: string;
        password?: string;

        posts?: Post[];
        identityCard?: IdentityCard;

        relationships = {
            posts: () => this.hasMany(Post, '_id', 'userId'),
            identityCard: () => this.hasOne(IdentityCard, '_id', 'userId'),
        } as {
            posts: () => QueryBuilder<Post>;
            identityCard: () => QueryBuilder<IdentityCard>;
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

    class IdentityCard extends Model {
        static dbName = dbName;

        userId!: string;
        number!: string;
        relationships = {
            user: () => this.belongsTo(User, 'userId', '_id'),
        } as {
            user: () => QueryBuilder<User>;
        };
    }

    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName, adapter: 'memory', silentConnect: true, });
    });

    it('should be able to save with relationships', async () => {
        const user = await User.create({
            name: 'John',
            posts: [
                new Post({ title: 'hello world', }),
                new Post({ title: 'hi world', }),
            ],
        });
        expect(user).toBeInstanceOf(User);

        const posts = user.posts as Post[];

        const post1 = posts[0];
        const dbPost1 = await Post.find(post1._id) as Post;
        expect(dbPost1).toBeInstanceOf(Post);
        expect(dbPost1).toEqual(jasmine.objectContaining({
            title: post1.title,
            userId: user._id,
        }));

        const dbUser = await dbPost1.relationships.user().first();
        expect(dbUser).toBeInstanceOf(User);
        expect(dbUser).toEqual(jasmine.objectContaining({
            name: user.name,
        }));


        const post2 = posts[0];
        const dbPost2 = await Post.find(post2._id);
        expect(dbPost2).toBeInstanceOf(Post);
        expect(dbPost2).toEqual(jasmine.objectContaining({
            title: post2.title,
        }));

        await user.update({
            identityCard: new IdentityCard({ number: '123456', }),
        });
        const card = user.identityCard as IdentityCard;
        const dbCard = await IdentityCard.find(card._id);
        expect(card).toBeInstanceOf(IdentityCard);
        expect(dbCard).toEqual(jasmine.objectContaining({
            _id: card._id,
            number: card.number,
        }));
    });
});