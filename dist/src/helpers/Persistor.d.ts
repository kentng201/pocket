export declare class Persistor {
    static set<T>(value: T): void;
    static clear(): void;
    static get<T>(): T | undefined;
}
