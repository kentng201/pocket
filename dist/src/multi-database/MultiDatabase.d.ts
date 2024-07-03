import { BaseModel } from '..';
export type SubDatabase = {
    adapter: string;
    isEncrypted: boolean;
    url: string;
};
export default class MultipleDatabase extends BaseModel {
    databaseName: string;
    subDatabases: SubDatabase[];
}
