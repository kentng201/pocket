import { RelationshipType } from 'src/definitions/RelationshipType';
import { BaseModel } from '../model/Model';
import { singular } from 'pluralize';
import { lowerCaseFirst } from 'src/helpers/stringHelper';
import { ModelStatic } from 'src/definitions/Model';

export type RelationshipParams = [RelationshipType, ModelStatic<any>[], Array<string>];

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

export function BelongsTo(relationshipFunc: Function, localKey?: string, foreignKey?: string) {
    const relationship = relationshipFunc();
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = `${lowerCaseFirst(singular(new relationship().cName))}Id`;
        if (!foreignKey) foreignKey = '_id';
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO, [relationship,], [localKey as string, foreignKey as string,],]);
    };
}

export function HasOne(relationshipFunc: Function, localKey?: string, foreignKey?: string) {
    const relationship = relationshipFunc();
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = '_id';
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        setRelationship(target, propertyKey, [RelationshipType.HAS_ONE, [relationship,], [localKey as string, foreignKey as string,],]);
    };
}

export function HasMany(relationshipFunc: Function, localKey?: string, foreignKey?: string) {
    const relationship = relationshipFunc();
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = '_id';
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        setRelationship(target, propertyKey, [RelationshipType.HAS_MANY, [relationship,], [localKey as string, foreignKey as string,],]);
    };
}

export function BelongsToMany(relationshipFunc: Function, pivotFunc: Function, localKey?: string, foreignKey?: string) {
    const relationship = relationshipFunc();
    const pivot = pivotFunc;
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(new relationship().cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        setRelationship(target, propertyKey, [RelationshipType.BELONGS_TO_MANY, [relationship, pivot,], [localKey as string, foreignKey as string,],]);
    };
}