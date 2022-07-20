"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUniqueKeyError = exports.isForeignKeyError = void 0;
const isDataBaseError = (err) => err instanceof Error && 'driverError' in err;
const isDataBaseErrorWithCode = (err, code) => isDataBaseError(err) && err.driverError.code === code;
const isForeignKeyError = (err) => isDataBaseErrorWithCode(err, '23503');
exports.isForeignKeyError = isForeignKeyError;
const isUniqueKeyError = (err) => isDataBaseErrorWithCode(err, '23505');
exports.isUniqueKeyError = isUniqueKeyError;
//# sourceMappingURL=errorHandlingUtils.js.map