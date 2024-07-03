"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelName = exports.getModelClass = exports.PocketModel = exports.classes = void 0;
const pluralize_1 = __importDefault(require("pluralize"));
exports.classes = {};
function PocketModel(model) {
    if (exports.classes[model.name])
        return;
    exports.classes[model.name] = model;
}
exports.PocketModel = PocketModel;
function getModelClass(modelName) {
    if (!exports.classes[modelName])
        throw new Error(`Model ${modelName} not found`);
    return exports.classes[modelName];
}
exports.getModelClass = getModelClass;
function getModelName(collectionName) {
    for (const key of Object.keys(exports.classes)) {
        if (collectionName === (exports.classes[key].collectionName || (0, pluralize_1.default)(exports.classes[key].name)))
            return key;
    }
    return null;
}
exports.getModelName = getModelName;
//# sourceMappingURL=ModelDecorator.js.map