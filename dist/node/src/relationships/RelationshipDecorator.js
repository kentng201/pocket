"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelongsToMany = exports.HasMany = exports.HasOne = exports.BelongsTo = exports.convertIdFieldsToModelIds = exports.convertIdFieldsToDocIds = exports.getForeignIdFields = exports.getLocalIdFields = exports.getRelationships = exports.setRelationship = exports.foreignKeys = void 0;
const RelationshipType_1 = require("../definitions/RelationshipType");
const Model_1 = require("../model/Model");
const __1 = require("..");
exports.foreignKeys = {};
function setRelationship(target, propertyKey, params) {
    if (!(target instanceof Model_1.BaseModel))
        throw new Error('Target must be an instance of BaseModel');
    if (!exports.foreignKeys[target.cName])
        exports.foreignKeys[target.cName] = {};
    exports.foreignKeys[target.cName][propertyKey] = params;
}
exports.setRelationship = setRelationship;
function getRelationships(model) {
    return exports.foreignKeys[model.cName] || {};
}
exports.getRelationships = getRelationships;
function getLocalIdFields(model) {
    const relationships = getRelationships(model);
    let fields = Object.keys(relationships).map((key) => {
        if (relationships[key][0] === RelationshipType_1.RelationshipType.BELONGS_TO) {
            const relationshipName = relationships[key][1][0];
            const relationship = (0, __1.getModelClass)(relationshipName);
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
exports.getLocalIdFields = getLocalIdFields;
function getForeignIdFields(model) {
    const relationships = getRelationships(model);
    let fields = Object.keys(relationships).map((key) => {
        if (relationships[key][0] === RelationshipType_1.RelationshipType.BELONGS_TO) {
            const relationshipName = relationships[key][1][0];
            const relationship = (0, __1.getModelClass)(relationshipName);
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
exports.getForeignIdFields = getForeignIdFields;
function convertIdFieldsToDocIds(attributes, model) {
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
exports.convertIdFieldsToDocIds = convertIdFieldsToDocIds;
function convertIdFieldsToModelIds(attributes, model) {
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
exports.convertIdFieldsToModelIds = convertIdFieldsToModelIds;
function BelongsTo(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType_1.RelationshipType.BELONGS_TO, [relationship,], [localKey, foreignKey,],]);
    };
}
exports.BelongsTo = BelongsTo;
function HasOne(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType_1.RelationshipType.HAS_ONE, [relationship,], [localKey, foreignKey,],]);
    };
}
exports.HasOne = HasOne;
function HasMany(relationship, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType_1.RelationshipType.HAS_MANY, [relationship,], [localKey, foreignKey,],]);
    };
}
exports.HasMany = HasMany;
function BelongsToMany(relationship, pivot, localKey, foreignKey) {
    return function (target, propertyKey) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType_1.RelationshipType.BELONGS_TO_MANY, [relationship, pivot,], [localKey, foreignKey,],]);
    };
}
exports.BelongsToMany = BelongsToMany;
//# sourceMappingURL=RelationshipDecorator.js.map