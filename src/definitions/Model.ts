// reference from: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
export type ReservedFieldForSelect = 'cName' | 'needTimestamp' | 'relationships' | '_dirty' | 'formatResponse';
export type FunctionlessModel<T> = Omit<Omit<T, {
    [Key in keyof T]: T[Key] extends () => Promise<object> | object | void ? Key : never;
}[keyof T]>, ReservedFieldForSelect>;

export type ModelStatic<T extends object> = {
    new(attributes?: ModelType<T> | object): T
};
export type ModelType<T extends object> = FunctionlessModel<T> & {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    cName?: unknown;
    needTimestamp?: unknown;
    relationships?: { [relationshipName: string]: () => Promise<object> | object | void };
    _dirty?: { [key: string]: boolean };
};
export type ModelKey<T extends object> = keyof FunctionlessModel<T> | '_id';
export type ModelValue<T extends object, Key extends ModelKey<T>> = T[Key];


