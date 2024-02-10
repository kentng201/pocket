# Pocket

Pocket is a PouchDB/CouchDB object modeling tools designed to work in the browser and Node.js.

### Getting Started

First install Node.js and npm. Then install Pocket via:

If your target environment is browser (Vue.js, React.js, React Native, etc), then

```bash
npm run build:browser
```

If your target environement is Node.js (SDK, Express.js, Nest.js, etc), then

```bash
npm run build:node 
```

You will receive a zip file with following format:
`pocket-<version>.tgz`

Then bring this node_modules into the target project and run:

```bash
npm install pocket-<version>.tgz
```

For example,

```bash
npm install pocket-0.3.1.tgz
```

### Caution of Vite

If you are using Vite, you may found the issue that "ReferenceError: global is not defined"
In this case, you need to add the following code to your `vite.config.js` file

```typescript
import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
+   define: { global: 'window' },
})
```

### Project Setup

#### **Vue.js/React.js**

Create a file `pocket.config.json` inside the `public` folder

- modelTimestamp: if true, your model will have a createdAt and updatedAt field
- realtimeUpdate: if true, your model will sync with other model with same id
- databases: an array of database configuration
  - dbName: name of the database
  - syncSetName: name of the sync set, all database with same syncSetName will sync with each other
  - url: database url
  - password: encrypt your database
  - silentConnect: if true, the database will not connect to the server when the app starts

```json
{
    "modelTimestamp": true,
    "realtimeUpdate": true,
    "databases": [
        {
            "dbName": "local",
            "syncSetName": "mainDb",
            "url": "mainDb",
            "password": "234568",
            "silentConnect": true
        },
        {
            "dbName": "userData",
            "syncSetName": "user-data-do-not-sync",
            "url": "userData",
            "password": "809480",
            "silentConnect": true
        },
        {
            "dbName": "online",
            "syncSetName": "mainDb",
            "url": "${ONLINE_REMOTE}:5984/mainDb",
            "silentConnect": true,
            "auth": {
                "username": "admin",
                "password": "mysecretpassword"
            }
        }
    ]
}
```

You can either defined the variable inside the .env file or window object
`.env`

```env
# put this line into .env file
ONLINE_REMOTE=http://www.your-secret-db.com
...
```

In React.js, update your `index.tsx` as per below

```tsx
import pocket from "pocket";

window.ONLINE_REMOTE = 'http://www.your-secret-db.com:5984';
export default function Home() {
  useEffect(() => {
    pocket().then(async () => {
        // your query goes here
    });
  }, []);

  return ();
}
```

In Vue.js, update your `main.ts` as per below

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import pocket from "pocket";

window.ONLINE_REMOTE = 'http://www.your-secret-db.com:5984';
pocket().then(() => {
    createApp(App).use(router).mount("#app");
});
```

#### **Node.js(Express, Nest.js, etc)**

You may establish an manually connection via `DatabaseManager`

```ts
import { DatabaseManager } from "pocket";

async function init() {
    const db = await DatabaseManager.connect(
        /**
         * Database url:
         * If pure string, it will use in-memory adapter
         * If http url, it will connect to a remote database
         */
        'backend-database',
        {
            /**
             * The name will in your model
             * @default 'default'
             */
            name: 'backend-database',

            /**
             * Can be one of the below
             * idb: Indexed DB
             * memory: In memory database, suitable for testing
             * http: HTTP
             */
            adapter: 'memory',
        }
    )
}

// ... rest of your Node.js integration

// You may get same db by same name you stated in DatabaseManager.connect() function in the runtime.
const anotherSameDb = DatabaseManager.get('backend-database');
```

### Model

You can start to use Typescript classes to define your model

```typescript
import { Model } from 'pocket'

export class User extends Model {
    /**
     * connect to which dbName mentioned in the DatabaseManager
     * @default 'default'
     */
    static dbName = 'default';

    /**
     * when set to true, the instance will sync with other model with same id
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
console.log(user1); // {}
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
const newUser = await User.find(originalUser.id) as User;
newUser.name = 'Title-2';
await newUser.save();
while (originalUser._real_time_updating) {
    await Promise(res => setTimeout(res, 100)); // when syncing the data, sleep for every 100ms
}

const isEqual = originalUser === newUser; // true
```

For listen document change in vue js component, you can use the following code

```typescript
import { setDocChangeEventListener } from 'pocket';

setDocChangeEventListener((id: string) => {
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

There is 2 version of the package, one is for browser, another one is for node js

For Node.js version, please run below:

```bash
npm run build:node
```

For browser version, please run below:

```bash
npm run build:browser
```

Then you may install the pocket package in your project

```bash
npm install pocket
```

### Debugging

To debug, you can use debugger in the Visual Studio Code
Go to VS Code, and click on the debug icon on the left side
In "RUN AND DEBUG" session, open to the desire test spec file in vscode, and click play button beside "Jasmine Current File"
