import { BaseModel } from '../model/Model';
import { QueryBuilder } from '..';
export declare class RepoManager {
    private static repos;
    static get<T extends BaseModel>(model: T): QueryBuilder<T>;
}
