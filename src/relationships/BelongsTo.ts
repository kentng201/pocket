import { singular } from 'pluralize';
import { ModelKey, ModelStatic, ModelValue } from 'src/definitions/Model';
import { lowerCaseFirst } from 'src/helpers/stringHelper';
import Model from 'src/model/Model';
import QueryBuilder from 'src/query-builder/QueryBuilder';

export function belongsTo<T extends Model, R extends Model>(
    self: T, relationship: ModelStatic<R>, localKey?: ModelKey<T>, foreignKey?: ModelKey<R>,
) {
    const relationshipInstance = new relationship();
    if (!localKey) localKey = `${lowerCaseFirst(singular(relationshipInstance.cName))}Id` as ModelKey<T>;
    if (!foreignKey) foreignKey = '_id';

    const builder = new QueryBuilder<R>(relationshipInstance, undefined, self.dName, true);
    builder.where(foreignKey, '=', self[localKey] as ModelValue<R, ModelKey<R>>);
    return builder;
}