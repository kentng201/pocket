import { Model } from 'src/model/Model';
import { UserRelationship } from './UserRelationship';
import { BelongsTo } from 'src/index';

const dbName = 'model-relationships';
export class Employee extends Model {
    static dbName = dbName;

    name!: string;
    password?: string;
    userId!: string;

    @BelongsTo(require('./UserRelationship').UserRelationship, '_id', 'userId') user?: UserRelationship;
}