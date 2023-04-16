import { RelationshipType } from 'src/definitions/RelationshipType';
import { BaseModel } from '../model/Model';

export type RelationshipParams = [RelationshipType, Array<string>, Array<string | undefined>];

export type ForeignKeyModelMapper = {
    [model: string]: ForeignTypeMapper;
};

export type ForeignTypeMapper = {
    [key: string]: RelationshipParams;
};

export const foreignKeys: ForeignKeyModelMapper = {};

export function setRelationship(target: BaseModel, propertyKey: string, params: RelationshipParams) {
    if (!(target instanceof BaseModel)) throw new Error('Target must be an instance of BaseModel');
    if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
    foreignKeys[target.cName][propertyKey] = params;
}

export function getRelationships<T extends BaseModel>(model: T): ForeignTypeMapper {
    return foreignKeys[model.cName] || {};
}

export function BelongsTo(relationship: string, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO, [relationship,], [localKey, foreignKey,],]);
    };
}

export function HasOne(relationship: string, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.HAS_ONE, [relationship,], [localKey, foreignKey,],]);
    };
}

export function HasMany(relationship: string, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.HAS_MANY, [relationship,], [localKey, foreignKey,],]);
    };
}

export function BelongsToMany(relationship: string, pivot: string, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO_MANY, [relationship, pivot,], [localKey, foreignKey,],]);
    };
}