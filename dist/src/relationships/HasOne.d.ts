import { ModelKey, ModelStatic } from '../definitions/Model';
import { BaseModel } from '../model/Model';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export declare function hasOne<T extends BaseModel, R extends BaseModel>(self: T, relationship: ModelStatic<R>, localKey?: ModelKey<T>, foreignKey?: ModelKey<R>): QueryBuilder<R, []>;
