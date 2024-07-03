"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowerCaseFirst = exports.upperCaseFirst = void 0;
const upperCaseFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);
exports.upperCaseFirst = upperCaseFirst;
const lowerCaseFirst = (string) => string.charAt(0).toLowerCase() + string.slice(1);
exports.lowerCaseFirst = lowerCaseFirst;
exports.default = {};
//# sourceMappingURL=StringHelper.js.map