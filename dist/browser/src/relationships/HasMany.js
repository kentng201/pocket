import { singular } from 'pluralize';
import { RelationshipType } from '../definitions/RelationshipType';
import { lowerCaseFirst } from '../helpers/StringHelper';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export function hasMany(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = 'id';
    if (!foreignKey)
        foreignKey = `${lowerCaseFirst(singular(self.cName))}Id`;
    const builder = new QueryBuilder(relationshipInstance, undefined, self.dName);
    builder.setRelationshipType(RelationshipType.HAS_MANY, localKey, foreignKey);
    const selfCollectionName = self.cName;
    builder.where(foreignKey, '=', `${selfCollectionName}.${self[localKey]}`);
    return builder;
}
//# sourceMappingURL=HasMany.js.map