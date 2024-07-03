import { RelationshipType } from '../definitions/RelationshipType';
import { BaseModel } from '../model/Model';
import { ModelStatic } from '../definitions/Model';
export type RelationshipParams = [RelationshipType, Array<string>, Array<string | undefined>];
export type ForeignKeyModelMapper = {
    [model: string]: ForeignTypeMapper;
};
export type ForeignTypeMapper = {
    [key: string]: RelationshipParams;
};
export declare const foreignKeys: ForeignKeyModelMapper;
export declare function setRelationship(target: BaseModel, propertyKey: string, params: RelationshipParams): void;
export declare function getRelationships<T extends BaseModel>(model: T): ForeignTypeMapper;
type ForeignIdMeta = {
    relationship: ModelStatic<BaseModel>;
    field: string;
};
export declare function getLocalIdFields<T extends BaseModel>(model: T): Array<ForeignIdMeta>;
export declare function getForeignIdFields<T extends BaseModel>(model: T): Array<ForeignIdMeta>;
export declare function convertIdFieldsToDocIds<T extends BaseModel, Attributes extends Partial<BaseModel>>(attributes: Attributes, model: T): Attributes;
export declare function convertIdFieldsToModelIds<T extends BaseModel, Attributes extends Partial<BaseModel>>(attributes: Attributes, model: T): Attributes;
export declare function BelongsTo(relationship: string, localKey?: string, foreignKey?: string): <T extends BaseModel>(target: T, propertyKey: string) => void;
export declare function HasOne(relationship: string, localKey?: string, foreignKey?: string): <T extends BaseModel>(target: T, propertyKey: string) => void;
export declare function HasMany(relationship: string, localKey?: string, foreignKey?: string): <T extends BaseModel>(target: T, propertyKey: string) => void;
export declare function BelongsToMany(relationship: string, pivot: string, localKey?: string, foreignKey?: string): <T extends BaseModel>(target: T, propertyKey: string) => void;
export {};
