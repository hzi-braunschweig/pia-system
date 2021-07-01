"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArrayOfStrings = void 0;
function isArrayOfStrings(input) {
    return (Array.isArray(input) && input.every((entry) => typeof entry === 'string'));
}
exports.isArrayOfStrings = isArrayOfStrings;
//# sourceMappingURL=typeGuards.js.map