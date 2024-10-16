# Pocket

Pocket is a PouchDB/CouchDB object modeling tools designed to work in the Browser/Node.js/React Native.

|TABLE OF CONTENTS | LINK |
|---|---|
| Getting Started | [Getting Started](#getting-started) |
| Full Documentation | [Documentation](https://pocketjs.gitbook.io/pocket) |

### Getting Started

You may install Pocket via:

```
npm install https://github.com/kentng201/pocket
```

### Relationship

Pocket supported 4 types of relationships
Note: To prevent circular dependency, you need to use `require` to import the model

- belongsTo
- hasOne
- hasMany
- belongsToMany

`User.ts`

```typescript
import { PocketModel, Model, HasMany } from 'pocket';
@PocketModel
class User extends Model {
    name!: string;
    password?: string;

    @HasMany('Post', 'id', 'userId')
    posts?: Post[];
}
```

`Post.ts`

```typescript
import { PocketModel, Model, HasMany, BelongsTo } from 'pocket';

@PocketModel
class Post extends Model {
    title!: string;
    userId!: string;
    content?: string;

    @BelongsTo('User')
    user?: User;
}
```

When you create a new post, you can use the following way to create the relationship.

```typescript
const user = await User.create({
    name: 'John',
});

const post1 = await Post.create({ title: 'hello world', userId: user.docId });
const post2 = await Post.create({ title: 'nice to meet you, Malaysia', userId: user.docId });
```

When you query the user with post, can use following methods

```typescript
const userWithPosts = await User.with('posts').where('name', '=', 'John').first();

// output
User {
    id: '...',
    _rev: '1-xxxx',
    name: 'John',
    posts: [
        Post {
            id: '...',
            _rev: '1-xxxx',
            title: 'hello world',
            userId: '...',
        },
        Post {
            id: '...',
            _rev: '1-xxxx',
            title: 'nice to meet you, Malaysia',
            userId: '...',
        },
    ],
}
```

### Lifecycle Hooks

Pocket model supported below hooks when you call create/update/delete and save method:

- beforeSave
- afterSave
- beforeCreate
- afterCreate
- beforeUpdate
- afterUpdate
- beforeDelete
- afterDelete

```typescript
class User extends Model {
    name!: string;
    password?: string;

    beforeSave(user: User) {
        console.log('beforeSave: ', user);
    }

    afterSave(user: User) {
        console.log('afterSave: ', user);
    }
}

// when call save method, it will trigged beforeSave and afterSave
const user = new User({
    username: 'John',
});
await user.save() // beforeSave: User {...}
// afterSave: User {...}


```

### Real Time

If you define the model as real time, the object with same id with sync each other

```typescript
import { Model, setRealtime } from 'pocket'

setRealtime(true); // make sure you are set real time to true

class User extends Model {
    static realtimeUpdate = true;

    name!: string;
    password?: string;
}


const originalUser = await User.create({
    id: 'real-time',
    name: 'Title-1',
});
```

For listen document change in vue js component, you can use the following code

```typescript
import { onDocChange, Model } from 'pocket';

onDocChange((id: string, model: Model) => {
    this.$forceUpdate();
});
```

then your other model will update once related id document is updated

You can also sync your databases via following code, then your database will sync with each other

```typescript
import { syncDatabases, DatabaseManager } from 'pocket';

await DatabaseManager.connect('pocket-backend', {
    name: 'pocket-backend',
    adapter: 'http',
});
await DatabaseManager.connect('local', {
    name: 'local',
    adapter: 'idb',
});

syncDatabases('pocket-frontend', 'local');
```

### REST API Integration

The Pocket can be integrated with REST API, you can use the following methods to do so:

```typescript
import { Model, ApiHostManager } from 'pocket';

await DatabaseManager.connect('rest-api-integration');
ApiHostManager.addHost('http://pocket.test/api', 'pocket-backend'); // it will named the host http://pocket.test/api as pocket-backend

class User extends Model {
    static dbName = dbName;
    static apiName = 'pocket-backend'; // this will bind the api to the host pocket-backend when call api
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

// When you perform create, and set the apiAuto.create to true, it will call the following API:
const user = await User.create({
    id: 1,
    name: 'John',
});
// API called: POST http://pocket.test/api/users/1

await user.update({
    name: 'Jane',
});
// API called: PUT http://pocket.test/api/users/1

await user.delete();
// API called: DELETE http://pocket.test/api/users/1
```

You can also use the `api` to call the API manually

```typescript
await user.setRandomPassword(); // this will called API: POST http://pocket.test/api/users/1/random-password
await user.save(); // this will update both pouch db and API
```

### CouchDB Broken Connection

You have to setup the following in your CouchDB server in order to prevent broken connection

```bash

https://serverfault.com/questions/735760/increment-couchdb-concurrent-connections
```

### Testing

The project is using Node js version 19 to done
But, you need to make your Node js version to 14.0.0 in order to run the test case

```bash
npm run test
```

Then it will run through all the test suite.

### Build NPM Pack

You will need to build the package via following command

```bash
npm run build
```

Then you may install the pocket package in your project

```bash
npm install pocket
```

### Debugging

To debug, you can use debugger in the Visual Studio Code
Go to VS Code, and click on the debug icon on the left side
In "RUN AND DEBUG" session, open to the desire test spec file in vscode, and click play button beside "Jasmine Current File"

### TODO

- [] React Native Support
- [] Join and Save Support
- [] Master and Transactional Database Management per Month Support
- [] File System Zip Support
- [] Add Database Migration Tools
- [] Support Encrypted to Non-Encrypt Database Migrate and Vice Versa
