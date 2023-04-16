import { BelongsTo, HasMany, Model } from 'src/index';
import { PocketModel } from 'src/model/ModelDecorator';
import { Attachment } from './Attachment';
import { UserRelationship } from './UserRelationship';

const dbName = 'model-relationships';
@PocketModel
export class PostRelationship extends Model {
    static dbName = dbName;

    title!: string;
    userId!: string;
    content?: string;
    @HasMany('Attachment', '_id', 'postId') attachments?: Attachment[];
    @BelongsTo('UserRelationship', '_id', 'userId') user?: UserRelationship;
}