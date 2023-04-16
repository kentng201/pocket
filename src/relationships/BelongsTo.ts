import { singular } from 'pluralize';
import { ModelKey, ModelStatic, ModelValue } from 'src/definitions/Model';
import { RelationshipType } from 'src/definitions/RelationshipType';
import { lowerCaseFirst } from 'src/helpers/stringHelper';
import { BaseModel } from 'src/model/Model';
import { QueryBuilder } from 'src/query-builder/QueryBuilder';

export function belongsTo<T extends BaseModel, R extends BaseModel>(
    self: T, relationship: ModelStatic<R>, localKey?: ModelKey<T>, foreignKey?: ModelKey<R>
) {
    const relationshipInstance = new relationship();
    if (!localKey) localKey = `${lowerCaseFirst(singular(relationshipInstance.cName))}Id` as ModelKey<T>;
    if (!foreignKey) foreignKey = '_id';

    const builder = new QueryBuilder<R>(relationshipInstance, undefined, self.dName, true);
    if (localKey === '_id') localKey = 'docId' as ModelKey<T>;
    if (foreignKey === '_id') foreignKey = 'docId' as ModelKey<R>;
    builder.where(foreignKey, '=', self[localKey] as ModelValue<R, ModelKey<R>>);
    builder.setRelationshipType(RelationshipType.BELONGS_TO, localKey as string, foreignKey as string);
    return builder;
}