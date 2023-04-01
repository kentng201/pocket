import { singular } from 'pluralize';
import { ModelKey, ModelStatic, ModelValue } from 'src/definitions/Model';
import { lowerCaseFirst } from 'src/helpers/stringHelper';
import { Model } from 'src/model/Model';
import { QueryBuilder, RelationshipType } from 'src/query-builder/QueryBuilder';

export async function belongsToMany<T extends Model, R extends Model, P extends Model>(
    self: T, relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: ModelKey<P>, foreignKey?: ModelKey<P>
) {
    const relationshipInstance = new relationship();
    const pivotInstance = new pivot();

    if (!localKey) localKey = `${lowerCaseFirst(singular(self.cName))}Id` as ModelKey<P>;
    if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(relationshipInstance.cName))}Id` as ModelKey<P>;

    const pivotBuilder = new QueryBuilder<P>(pivotInstance);
    const pivotResult = await pivotBuilder.where(localKey, '=', self._id as ModelValue<P, ModelKey<P>>).get();
    const relationshipIds = pivotResult.map((p: P) => p[foreignKey as keyof P]) as string[];

    const builder = new QueryBuilder<R>(relationshipInstance);
    builder.where('_id', 'in', relationshipIds);
    builder.setRelationshipType(RelationshipType.BELONGS_TO_MANY, localKey as string, foreignKey as string);
    return builder;
}
