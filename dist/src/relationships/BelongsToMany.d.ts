import { ModelKey, ModelStatic } from '../definitions/Model';
import { BaseModel } from '../model/Model';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export declare function belongsToMany<T extends BaseModel, R extends BaseModel, P extends BaseModel>(self: T, relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: ModelKey<P>, foreignKey?: ModelKey<P>): Promise<QueryBuilder<R, []>>;
