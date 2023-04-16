import { singular } from 'pluralize';
import { ModelKey, ModelStatic, ModelValue } from 'src/definitions/Model';
import { lowerCaseFirst } from 'src/helpers/stringHelper';
import { Model } from 'src/model/Model';
import { QueryBuilder, RelationshipType } from 'src/query-builder/QueryBuilder';

export function hasMany<T extends Model, R extends Model>(
    self: T, relationship: ModelStatic<R>, localKey?: ModelKey<T>, foreignKey?: ModelKey<R>
) {
    const relationshipInstance = new relationship();
    if (!localKey) localKey = '_id';
    if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(self.cName))}Id` as ModelKey<R>;

    const builder = new QueryBuilder<R>(relationshipInstance, undefined, self.dName);
    builder.setRelationshipType(RelationshipType.HAS_MANY, localKey as string, foreignKey as string);
    if (localKey === '_id') localKey = 'docId' as ModelKey<T>;
    builder.where(foreignKey, '=', self[localKey] as ModelValue<R, ModelKey<R>>);
    return builder;
}