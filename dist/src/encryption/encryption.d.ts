export declare const transformer: {
    dbName: string;
    incoming: (doc: any) => {
        _id: any;
        _rev: any;
        payload: string;
    };
    outgoing: (doc: any) => any;
};
export declare function setEncryptionPassword(password: string, dbName: string): Promise<void>;
export declare function encrypt(data: any, dbName: string): string;
export declare function decrypt(data: string, dbName: string): any;
