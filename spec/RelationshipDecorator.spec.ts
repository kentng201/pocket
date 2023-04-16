import { DatabaseManager, BaseModel, Model } from "src/index";
import { HasMany } from "src/relationships/RelationshipDecorator";

const dbName = 'relationship-decorator';

describe('Relationship Decorator', () => {
    beforeEach(async () => {
        await DatabaseManager.connect(dbName, { dbName, adapter: 'memory', silentConnect: true, });
    });

    it('should able to query post', async () => {
        class DecoratorPost extends Model {
            static dbName = dbName;

            userId!: string;
        }

        class DecoratorUser extends Model {
            static dbName = dbName;
            name!: string;

            @HasMany(DecoratorPost, '_id', 'userId')
            posts?: DecoratorPost[];

            // relationships = {
            //     posts: () => this.hasMany(DecoratorPost, '_id', 'userId')
            // }
        }
        const user = await DecoratorUser.create({ name: 'test' });
        await DecoratorPost.create({ userId: user.docId, });
        await DecoratorPost.create({ userId: user.docId, });
        expect(user).toBeInstanceOf(DecoratorUser);
        await user.load('posts');
        const posts = user.posts;
        expect(posts).toBeInstanceOf(Array);
        expect(posts?.length).toEqual(2);
        expect(posts?.[0]).toBeInstanceOf(DecoratorPost);
    })
});