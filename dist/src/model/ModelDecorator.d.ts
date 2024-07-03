import { BaseModel } from '..';
export type ModelMapper = {
    [model: string]: typeof BaseModel;
};
export declare const classes: ModelMapper;
export declare function PocketModel<T extends typeof BaseModel>(model: T): void;
export declare function getModelClass(modelName: string): typeof BaseModel;
export declare function getModelName(collectionName: string): string | null;
