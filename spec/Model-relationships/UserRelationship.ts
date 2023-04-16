import { Model } from 'src/model/Model';
import { HasMany } from 'src/index';
import { PostRelationship } from './PostRelationship';

const dbName = 'model-relationships';
export class UserRelationship extends Model {
    static dbName = dbName;

    name!: string;
    password?: string;

    @HasMany(require('./PostRelationship').PostRelationship, '_id', 'userId') posts?: PostRelationship[];
}