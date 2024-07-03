"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.belongsTo = void 0;
const pluralize_1 = require("pluralize");
const RelationshipType_1 = require("../definitions/RelationshipType");
const StringHelper_1 = require("../helpers/StringHelper");
const QueryBuilder_1 = require("../query-builder/QueryBuilder");
function belongsTo(self, relationship, localKey, foreignKey) {
    const relationshipInstance = new relationship();
    if (!localKey)
        localKey = `${(0, StringHelper_1.lowerCaseFirst)((0, pluralize_1.singular)(relationshipInstance.cName))}Id`;
    if (!foreignKey)
        foreignKey = 'id';
    const builder = new QueryBuilder_1.QueryBuilder(relationshipInstance, undefined, self.dName, true);
    builder.where(foreignKey, '=', self[localKey]);
    builder.setRelationshipType(RelationshipType_1.RelationshipType.BELONGS_TO, localKey, foreignKey);
    return builder;
}
exports.belongsTo = belongsTo;
//# sourceMappingURL=BelongsTo.js.map