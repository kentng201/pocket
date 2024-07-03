import { singular } from 'pluralize';
import { RelationshipType } from '../definitions/RelationshipType';
import { lowerCaseFirst } from '../helpers/StringHelper';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export function belongsTo(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = `${lowerCaseFirst(singular(relationshipInstance.cName))}Id`;
    if (!foreignKey)
        foreignKey = 'id';
    const builder = new QueryBuilder(relationshipInstance, undefined, self.dName, true);
    builder.where(foreignKey, '=', self[localKey]);
    builder.setRelationshipType(RelationshipType.BELONGS_TO, localKey, foreignKey);
    return builder;
}
//# sourceMappingURL=BelongsTo.js.map