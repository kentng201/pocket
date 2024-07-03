import { RelationshipType } from '../definitions/RelationshipType';
import { BaseModel } from '../model/Model';
import { getModelClass } from '..';
export const foreignKeys = {};
export function setRelationship(target, propertyKey, params) {
    if (!(target instanceof BaseModel))
        throw new Error('Target must be an instance of BaseModel');
    if (!foreignKeys[target.cName])
        foreignKeys[target.cName] = {};
    foreignKeys[target.cName][propertyKey] = params;
}
export function getRelationships(model) {
    return foreignKeys[model.cName] || {};
}
export function getLocalIdFields(model) {
    const relationships = getRelationships(model);
    let fields = Object.keys(relationships).map((key) => {
        if (relationships[key][0] === RelationshipType.BELONGS_TO) {
            const relationshipName = relationships[key][1][0];
            const relationship = getModelClass(relationshipName);
            return {
                relationship,
                field: relationships[key][2][0],
            };
        }
        return undefined;
    });
    fields = [...new Set(fields),];
    const idFields = fields.filter((item) => item !== undefined && item.relationship !== undefined);
    return idFields;
}
export function getForeignIdFields(model) {
    const relationships = getRelationships(model);
    let fields = Object.keys(relationships).map((key) => {
        if (relationships[key][0] === RelationshipType.BELONGS_TO) {
            const relationshipName = relationships[key][1][0];
            const relationship = getModelClass(relationshipName);
            return {
                relationship,
                field: relationships[key][2][1],
            };
        }
        return undefined;
    });
    fields = [...new Set(fields),];
    const idFields = fields.filter((item) => item !== undefined && item.relationship !== undefined);
    return idFields;
}
export function convertIdFieldsToDocIds(attributes, model) {
    const idFields = [...getForeignIdFields(model), ...getLocalIdFields(model),];
    for (const idField of idFields) {
        if (idField.field === 'id')
            continue;
        const relationship = new idField.relationship;
        const prefix = relationship.cName + '.';
        const foreignKeyField = attributes[idField.field];
        if (!foreignKeyField)
            continue;
        if (!foreignKeyField.includes(prefix)) {
            attributes[idField.field] = prefix + attributes[idField.field];
        }
    }
    return attributes;
}
export function convertIdFieldsToModelIds(attributes, model) {
    const idFields = [...getForeignIdFields(model), ...getLocalIdFields(model),];
    for (const idField of idFields) {
        if (idField.field === 'id')
            continue;
        const relationship = new idField.relationship;
        const prefix = relationship.cName + '.';
        const foreignKeyField = attributes[idField.field];
        if (!foreignKeyField)
            continue;
        if (foreignKeyField.includes(prefix)) {
            attributes[idField.field] = attributes[idField.field]
                .replace(prefix, '');
        }
    }
    return attributes;
}
export function BelongsTo(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO, [relationship,], [localKey, foreignKey,],]);
    };
}
export function HasOne(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.HAS_ONE, [relationship,], [localKey, foreignKey,],]);
    };
}
export function HasMany(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.HAS_MANY, [relationship,], [localKey, foreignKey,],]);
    };
}
export function BelongsToMany(relationship, pivot, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO_MANY, [relationship, pivot,], [localKey, foreignKey,],]);
    };
}
//# sourceMappingURL=RelationshipDecorator.js.map