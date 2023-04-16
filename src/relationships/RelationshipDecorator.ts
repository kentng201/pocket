import { RelationshipType } from 'src/definitions/RelationshipType';
import { BaseModel } from '../model/Model';
import { ModelKey, ModelStatic } from 'src/definitions/Model';

export type RelationshipParams = [RelationshipType, ModelStatic<BaseModel>[], Array<string>];

export type ForeignKeyModelMapper = {
    [model: string]: ForeignTypeMapper;
}

export type ForeignTypeMapper = {
    [key: string]: RelationshipParams;
}

export const foreignKeys: ForeignKeyModelMapper = {};

export function getRelationships<T extends BaseModel>(model: T): ForeignTypeMapper {
    return foreignKeys[model.cName] || {};
}

export function BelongsTo<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: ModelKey<R>) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.BELONGS_TO, [relationship], [localKey as string, foreignKey as string]];
        }
    };
}

export function HasOne<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: ModelKey<R>) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.HAS_ONE, [relationship], [localKey as string, foreignKey as string]];
        }
    };
}

export function HasMany<R extends BaseModel>(relationship: ModelStatic<R>, localKey?: string, foreignKey?: ModelKey<R>) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.HAS_MANY, [relationship], [localKey as string, foreignKey as string]];
        }
    };
}

export function BelongsToMany<R extends BaseModel, P extends BaseModel>(relationship: ModelStatic<R>, pivot: ModelStatic<P>, localKey?: string, foreignKey?: ModelKey<R>, through?: string) {
    return function <T extends BaseModel>(target: T, propertyKey: string) {
        if (!target.relationships) {
            target.relationships = {};
        }
        if (!foreignKeys[target.cName]) foreignKeys[target.cName] = {};
        if (!foreignKeys[target.cName][propertyKey]) {
            foreignKeys[target.cName][propertyKey] = [RelationshipType.BELONGS_TO_MANY, [relationship, pivot], [localKey as string, foreignKey as string]];
        }
    };
}