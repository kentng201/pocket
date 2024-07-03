"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMany = void 0;
const pluralize_1 = require("pluralize");
const RelationshipType_1 = require("../definitions/RelationshipType");
const StringHelper_1 = require("../helpers/StringHelper");
const QueryBuilder_1 = require("../query-builder/QueryBuilder");
function hasMany(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = 'id';
    if (!foreignKey)
        foreignKey = `${(0, StringHelper_1.lowerCaseFirst)((0, pluralize_1.singular)(self.cName))}Id`;
    const builder = new QueryBuilder_1.QueryBuilder(relationshipInstance, undefined, self.dName);
    builder.setRelationshipType(RelationshipType_1.RelationshipType.HAS_MANY, localKey, foreignKey);
    const selfCollectionName = self.cName;
    builder.where(foreignKey, '=', `${selfCollectionName}.${self[localKey]}`);
    return builder;
}
exports.hasMany = hasMany;
//# sourceMappingURL=HasMany.js.map