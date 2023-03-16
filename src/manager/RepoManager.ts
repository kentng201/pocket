import { Model } from 'src/model/Model';
import { Repo } from 'src/repo/Repo';
import { APIResourceInfo, ApiHostManager } from './ApiHostManager';

export class RepoManager {
    private static repos: { [collectionName: string]: Repo<any> } = {};

    static get<T extends Model>(model: T): Repo<T> {
        const dbName = model.dName;
        const apiName = model.aName;
        const apiInfo = apiName ? ApiHostManager.getApiInfo(apiName) : undefined;
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
        if (!this.repos[collectionName]) {
            this.repos[collectionName] = new Repo<T>(model, [], dbName, undefined, apiResourceInfo);
        }
        return this.repos[collectionName];
    }
}

