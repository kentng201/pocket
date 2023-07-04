export class Persistor {
    static set<T>(value: T) {
        // do nothing
    }
    static clear() {
        // do nothing
    }
    static get<T>(): T | undefined {
        return {} as T;
    }
}