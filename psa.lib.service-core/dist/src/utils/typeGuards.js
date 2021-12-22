"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNonNullishProperty = exports.hasProperty = exports.isArrayOfStrings = void 0;
function isArrayOfStrings(input) {
    return (Array.isArray(input) && input.every((entry) => typeof entry === 'string'));
}
exports.isArrayOfStrings = isArrayOfStrings;
function hasProperty(obj, key) {
    return typeof obj === 'object' && obj !== null && key in obj;
}
exports.hasProperty = hasProperty;
function hasNonNullishProperty(obj, key) {
    return hasProperty(obj, key) && obj[key] !== undefined && obj[key] !== null;
}
exports.hasNonNullishProperty = hasNonNullishProperty;
//# sourceMappingURL=typeGuards.js.map