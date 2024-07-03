"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOne = void 0;
const pluralize_1 = require("pluralize");
const RelationshipType_1 = require("../definitions/RelationshipType");
const StringHelper_1 = require("../helpers/StringHelper");
const QueryBuilder_1 = require("../query-builder/QueryBuilder");
function hasOne(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = 'id';
    if (!foreignKey)
        foreignKey = `${(0, StringHelper_1.lowerCaseFirst)((0, pluralize_1.singular)(self.cName))}Id`;
    const builder = new QueryBuilder_1.QueryBuilder(relationshipInstance, undefined, self.dName, true);
    builder.setRelationshipType(RelationshipType_1.RelationshipType.HAS_ONE, localKey, foreignKey);
    builder.where(foreignKey, '=', self[localKey]);
    return builder;
}
exports.hasOne = hasOne;
//# sourceMappingURL=HasOne.js.map