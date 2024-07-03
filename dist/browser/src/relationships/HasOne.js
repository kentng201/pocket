import { singular } from 'pluralize';
import { RelationshipType } from '../definitions/RelationshipType';
import { lowerCaseFirst } from '../helpers/StringHelper';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export function hasOne(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = 'id';
    if (!foreignKey)
        foreignKey = `${lowerCaseFirst(singular(self.cName))}Id`;
    const builder = new QueryBuilder(relationshipInstance, undefined, self.dName, true);
    builder.setRelationshipType(RelationshipType.HAS_ONE, localKey, foreignKey);
    builder.where(foreignKey, '=', self[localKey]);
    return builder;
}
//# sourceMappingURL=HasOne.js.map