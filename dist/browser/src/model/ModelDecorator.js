import pluralize from 'pluralize';
export const classes = {};
export function PocketModel(model) {
    if (classes[model.name])
        return;
    classes[model.name] = model;
}
export function getModelClass(modelName) {
    if (!classes[modelName])
        throw new Error(`Model ${modelName} not found`);
    return classes[modelName];
}
export function getModelName(collectionName) {
    for (const key of Object.keys(classes)) {
        if (collectionName === (classes[key].collectionName || pluralize(classes[key].name)))
            return key;
    }
    return null;
}
//# sourceMappingURL=ModelDecorator.js.map