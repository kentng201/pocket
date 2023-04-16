// reference from: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
export type ReservedFieldForSelect = 'cName' | 'dName' | 'needTimestamp' | 'relationships' | '_dirty' | '_before_dirty' | 'formatResponse' | '_id' | '_rev' | 'rtUpdate' | '_real_time_updating' | '_fallback_api_doc' | 'aName' | 'aResource' | 'aAuto' | 'docId' | 'modelId';
export type FunctionlessModel<T> = Omit<Omit<T, {
    [Key in keyof T]: T[Key] extends Function ? Key : never;
}[keyof T]>, ReservedFieldForSelect>;

export type ModelStatic<T extends object> = {
    new(attributes?: ModelType<T> | object): T
};
export type ModelType<T extends object> = FunctionlessModel<T> & {
    _id: string;
    _rev: string;
    createdAt?: string;
    updatedAt?: string;
    cName?: unknown;
    dName?: unknown;
    needTimestamp?: unknown;
    relationships?: { [relationshipName: string]: () => Promise<object> | object | void };
    _dirty?: { [key: string]: boolean };
    _before_dirty?: { [key: string]: any };
    _real_time_updating?: boolean;
    _fallback_api_doc?: boolean;
};
export type NewModelType<T extends object> = Omit<ModelType<T>, '_id' | '_rev'> & {
    _id?: string;
    _rev?: string;
};
export type ModelKey<T extends object> = keyof FunctionlessModel<T> | '_id';
export type ModelValue<T extends object, Key extends keyof T> = T[Key];


