"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncForEachParallel = exports.asyncMapParallel = exports.asyncForEach = exports.asyncMap = void 0;
async function asyncMap(array, callback) {
    const outputArray = [];
    for (let index = 0; index < array.length; index++) {
        outputArray[index] = await callback(array[index], index, array);
    }
    return outputArray;
}
exports.asyncMap = asyncMap;
async function asyncForEach(array, callback) {
    await asyncMap(array, callback);
}
exports.asyncForEach = asyncForEach;
async function asyncMapParallel(array, callback, maxParallel) {
    const input = array.map((entry, index) => {
        return {
            entry,
            index,
        };
    });
    const outputArray = new Array(array.length);
    await Promise.all(Array.from(Array(maxParallel).keys()).map(async () => {
        for (;;) {
            const work = input.shift();
            if (!work) {
                return;
            }
            outputArray[work.index] = await callback(work.entry, work.index, array);
        }
    }));
    return outputArray;
}
exports.asyncMapParallel = asyncMapParallel;
async function asyncForEachParallel(array, callback, maxParallel) {
    await asyncMapParallel(array, callback, maxParallel);
}
exports.asyncForEachParallel = asyncForEachParallel;
//# sourceMappingURL=async.js.map