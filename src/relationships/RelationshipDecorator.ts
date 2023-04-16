import { RelationshipType } from 'src/definitions/RelationshipType';
import { BaseModel } from '../model/Model';
import { ModelStatic } from 'src/definitions/Model';
import { singular } from 'pluralize';
import { lowerCaseFirst } from 'src/helpers/stringHelper';

export type RelationshipParams = [RelationshipType, ModelStatic<BaseModel>[], Array<string>];

export type ForeignKeyModelMapper = {
    [model: string]: ForeignTypeMapper;
};

export type ForeignTypeMapper = {
    [key: string]: RelationshipParams;
};

export const foreignKeys: ForeignKeyModelMapper = {};

export function getRelationships<T extends BaseModel>(model: T): ForeignTypeMapper {
    return foreignKeys[model.cName] || {};
}

export function BelongsTo<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = `${lowerCaseFirst(singular(new relationship().cName))}Id`;
        if (!foreignKey) foreignKey = '_id';
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.BELONGS_TO, [relationship,], [localKey as string, foreignKey as string,],];
        }
    };
}

export function HasOne<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = '_id';
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.HAS_ONE, [relationship,], [localKey as string, foreignKey as string,],];
        }
    };
}

export function HasMany<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = '_id';
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.HAS_MANY, [relationship,], [localKey as string, foreignKey as string,],];
        }
    };
}

export function BelongsToMany<R extends BaseModel, P extends BaseModel>(relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: string, foreignKey?: string, through?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!localKey) localKey = `${lowerCaseFirst(singular(target.cName))}Id`;
        if (!foreignKey) foreignKey = `${lowerCaseFirst(singular(new relationship().cName))}Id`;
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.BELONGS_TO_MANY, [relationship, pivot,], [localKey as string, foreignKey as string,],];
        }
    };
}