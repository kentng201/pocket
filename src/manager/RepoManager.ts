import { Model } from 'src/model/Model';
import { APIResourceInfo, ApiHostManager } from './ApiHostManager';
import { QueryBuilder } from '..';

export class RepoManager {
    private static repos: { [collectionName: string]: QueryBuilder<any> } = {};

    static get<T extends Model>(model: T): QueryBuilder<T> {
        const dbName = model.dName;
        const apiName = model.aName;
        const apiInfo = apiName ? ApiHostManager.getApiInfo(apiName) : {};
        const apiResourceInfo = {
            ...apiInfo,
            resource: model.aResource,
            apiAutoCreate: model.aAuto?.create,
            apiAutoUpdate: model.aAuto?.update,
            apiAutoDelete: model.aAuto?.delete,
            apiAutoSoftDelete: model.aAuto?.softDelete,
            apiFallbackGet: model.aAuto?.fetchWhenMissing,
        } as APIResourceInfo;

        const collectionName = model.cName;
        const haveApiConfig = Object
            .keys(apiResourceInfo)
            .filter(
                (attribute) => !!apiResourceInfo[attribute as keyof APIResourceInfo] as boolean
            )
            .length > 0;
        if (!this.repos[collectionName]) {
            this.repos[collectionName] = new QueryBuilder<T>(
                model, undefined, dbName, undefined, haveApiConfig ? apiResourceInfo : undefined
            );
        }
        return this.repos[collectionName];
    }
}

