import { BaseModel } from '..';

export type ModelMapper = {
    [model: string]: typeof BaseModel;
};

export const classes: ModelMapper = {};

export function PocketModel<T extends typeof BaseModel>(model: T) {
    if (classes[model.name]) return;
    classes[model.name] = model;
    console.log(`Class ${model.name} registered`);
}

export function getModelClass(modelName: string): typeof BaseModel {
    if (!classes[modelName]) throw new Error(`Model ${modelName} not found`);
    return classes[modelName];
}