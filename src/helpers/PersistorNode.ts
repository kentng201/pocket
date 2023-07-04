export class Persistor {
    static set<T>(value: T) {
        console.log('do nothing on node.js');
    }
    static clear() {
        console.log('do nothing on node.js');
    }
    static get<T>(): T | undefined {
        return {} as T;
    }
}