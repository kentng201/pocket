import { Model } from 'src/model/Model';
import { Attachment } from './Attachment';
import { BelongsTo, HasMany } from 'src/index';
import { UserRelationship } from './UserRelationship';

const dbName = 'model-relationships';
export class PostRelationship extends Model {
    static dbName = dbName;

    title!: string;
    userId!: string;
    content?: string;
    @HasMany(require('./Attachment').Attachment, '_id', 'postId') attachments?: Attachment[];

    @BelongsTo(require('./UserRelationship').UserRelationship, '_id', 'userId') user?: UserRelationship;

}