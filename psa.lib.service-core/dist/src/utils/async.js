"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncMap = exports.asyncForEach = void 0;
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
exports.asyncForEach = asyncForEach;
async function asyncMap(array, callback) {
    const outputArray = [];
    for (let index = 0; index < array.length; index++) {
        outputArray[index] = await callback(array[index], index, array);
    }
    return outputArray;
}
exports.asyncMap = asyncMap;
//# sourceMappingURL=async.js.map