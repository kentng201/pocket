import { BelongsTo } from 'src/index';
import { Model } from 'src/model/Model';
import { PostRelationship } from './PostRelationship';

const dbName = 'model-relationships';
export class Attachment extends Model {
    static dbName = dbName;

    name!: string;
    url!: string;
    postId!: string;

    @BelongsTo(require('./PostRelationship').PostRelationship, '_id', 'postId') post?: PostRelationship;
}