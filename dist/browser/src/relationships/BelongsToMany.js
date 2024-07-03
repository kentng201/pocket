var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { singular } from 'pluralize';
import { RelationshipType } from '../definitions/RelationshipType';
import { lowerCaseFirst } from '../helpers/StringHelper';
import { QueryBuilder } from '../query-builder/QueryBuilder';
export function belongsToMany(self, relationship, pivot, localKey, foreignKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const relationshipInstance = new relationship();
        const pivotInstance = new pivot();
        if (!localKey)
            localKey = `${lowerCaseFirst(singular(self.cName))}Id`;
        if (!foreignKey)
            foreignKey = `${lowerCaseFirst(singular(relationshipInstance.cName))}Id`;
        const pivotBuilder = new QueryBuilder(pivotInstance);
        const pivotResult = yield pivotBuilder.where(localKey, '=', self.id).get();
        const relationshipIds = pivotResult.map((p) => p[foreignKey]);
        const builder = new QueryBuilder(relationshipInstance);
        builder.where('id', 'in', relationshipIds);
        builder.setRelationshipType(RelationshipType.BELONGS_TO_MANY, localKey, foreignKey);
        return builder;
    });
}
//# sourceMappingURL=BelongsToMany.js.map