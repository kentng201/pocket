"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.belongsToMany = void 0;
const pluralize_1 = require("pluralize");
const RelationshipType_1 = require("../definitions/RelationshipType");
const StringHelper_1 = require("../helpers/StringHelper");
const QueryBuilder_1 = require("../query-builder/QueryBuilder");
function belongsToMany(self, relationship, pivot, localKey, foreignKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const relationshipInstance = new relationship();
        const pivotInstance = new pivot();
        if (!localKey)
            localKey = `${(0, StringHelper_1.lowerCaseFirst)((0, pluralize_1.singular)(self.cName))}Id`;
        if (!foreignKey)
            foreignKey = `${(0, StringHelper_1.lowerCaseFirst)((0, pluralize_1.singular)(relationshipInstance.cName))}Id`;
        const pivotBuilder = new QueryBuilder_1.QueryBuilder(pivotInstance);
        const pivotResult = yield pivotBuilder.where(localKey, '=', self.id).get();
        const relationshipIds = pivotResult.map((p) => p[foreignKey]);
        const builder = new QueryBuilder_1.QueryBuilder(relationshipInstance);
        builder.where('id', 'in', relationshipIds);
        builder.setRelationshipType(RelationshipType_1.RelationshipType.BELONGS_TO_MANY, localKey, foreignKey);
        return builder;
    });
}
exports.belongsToMany = belongsToMany;
//# sourceMappingURL=BelongsToMany.js.map