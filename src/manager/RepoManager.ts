import { Model } from 'src/model/Model';
import { Repo } from 'src/repo/Repo';

export class RepoManager {
    private static repos: {[collectionName: string]: Repo<any>} = {};

    static get<T extends Model>(model: T): Repo<T> {
        const dbName = model.dName;
        const collectionName = model.cName;
        if (!this.repos[collectionName]) {
            this.repos[collectionName] = new Repo<T>(model, [], dbName);
        }
        return this.repos[collectionName];
    }
}

