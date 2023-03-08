# Pocket 

Pocket is a PouchDB/CouchDB object modeling tools designed to work in the browser and Node.js.

### Getting Started

First install Node.js and npm. Then install Pocket:
```bash
$ npm install pocket
```

### Database Connection

To connect to a database, specify the database and the adapter

```typescript
import { DatabaseManager, setEnvironement, setRealtime } from 'pocket';

setEnvironement('browser'); // set environment to browser or node

const databaseConfig = {
    dbName: 'default', // database name, required when multiple database connection
    adapter: 'idb', // available adapter: idb, memory
    silentConnect: true, // if true, the database will connect without console.log
};
await DatabaseManager.connect('test', databaseConfig); // connect to local database named "test"

setRealtime(true); // if you set real time to true, the object with same _id with sync each other 
```

### Model

You can start to use Typescript classes to define your model
```typescript
import { Model } from 'pocket'

export class User extends Model {
    /**
     * connect to which dbName mentioned in the DatabaseManager
     */
    static dbName = 'default';

    /**
     * when set to true, the instance will sync with other model with same _id
     * @default true
     */
    static realtimeUpdate = true;

    /**
     * when set to true, the instance will have a createdAt and updatedAt field
     * @default true
     */
    static timestamp = true;

    /**
     * the namespace where the similar document grouping together
     * @default 'Plural form of the class name, e.g. Users'
     */
    static collectionName = 'Users';


    username!: string; // when marked as !, it is mandatory before saved to database
    password?: string; // when marked as ?, it is optional to save to database

    setRandomPassword() {
        this.password = Math.random();
    }
}
```

### Create, Update, Delete

You can create a model instance in both way:
Both way will create a document in the database.
```typescript
// Type 1
const user1 = new User();
user1.username = 'John';
await user1.save();

// Type 2
const user2 = await User.create({
    username: 'Jane',
});
```


Update
```typescript
// Type 1
user1.update({
    username: 'Jonny',
});

// Type 2
user1.username = 'Jonny English';
await user1.save();
```

Delete
```typescript
await user1.delete();
console.log(await user1); // {}
```

### Query

You can query the documents by using the powerful query builder
```typescript
// Type 1, key, operator and value search
// Supported operators: '=', '>', '>=', '<', '<=', '!=', 'in', 'not in', 'between', 'like'
const users = await User
    .query()
    .where('username', '=', 'John')
    .orWhere('username', '=', 'Jane')
    .get();

// Type 2, object search
const users = await User.query().where({
    'username': 'John',
    'password': '1234',
}).get();

// Type 2, advance object search
const users = await User.query().where({
    'username': ['=', 'John'],
    'password': ['in', ['1234', '12345']],
}).get();


// Type 3, function search
const users = await User.query().where((query) => {
    query.where('username', '=', 'John');
    query.orWhere('username', '=', 'Jane');
}).get();
```

### Relationship
Pocket supported 4 types of relationships
- belongsTo
- hasOne
- hasMany
- belongsToMany

```typescript
import { Model } from 'pocket';
class User extends Model {
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
    title!: string;
    userId!: string;
    content?: string;
    relationships = {
        user: () => this.belongsTo(User),
    } as {
        user: () => QueryBuilder<User>;
    };
}
```

When you create a new post, you can use the following way to create the relationship.
```typescript
const user = await User.create({
    name: 'John',
});
expect(user).toBeInstanceOf(User);

const post1 = await Post.create({ title: 'hello world', userId: user._id });
const post2 = await Post.create({ title: 'nice to meet you, Malaysia', userId: user._id });
```

When you query the user with post, can use following methods
```typescript
const userWithPosts = await User.with('posts').where('name', '=', 'John').first();

// output
{
    _id: '...',
    _rev: '1-xxxx',
    name: 'John',
    posts: [
        {
            _id: '...',
            _rev: '1-xxxx',
            title: 'hello world',
            userId: '...',
        },
        {
            _id: '...',
            _rev: '1-xxxx',
            title: 'nice to meet you, Malaysia',
            userId: '...',
        },
    ],
}
```

### Real Time

If you define the model as real time, the object with same _id with sync each other
```typescript
import { Model, setRealtime } from 'pocket'

setRealtime(true); // make sure you are set real time to true

class User extends Model {
    static realtimeUpdate = true;

    name!: string;
    password?: string;
}


const originalUser = await RealTimeUser.create({
    _id: 'real-time',
    name: 'Title-1',
});
const newUser = await RealTimeUser.find(originalUser._id) as RealTimeUser;
newUser.name = 'Title-2';
await newUser.save();
while (originalUser._real_time_updating) {
    await Promise(res => setTimeout(res, 100)); // when syncing the data, sleep for every 100ms
}

const isEqual = originalUser === newUser; // true
```