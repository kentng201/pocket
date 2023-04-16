import { BaseModel } from '..';

export type ModelMapper = {
    [model: string]: typeof BaseModel;
};

export const classes: ModelMapper = {};

export function PocketModel<T extends typeof BaseModel>(model: T) {
    classes[model.name] = model;
}

export function getModel(modelName: string): typeof BaseModel {
    if (!classes[modelName]) throw new Error(`Model ${modelName} not found`);
    return classes[modelName];
}