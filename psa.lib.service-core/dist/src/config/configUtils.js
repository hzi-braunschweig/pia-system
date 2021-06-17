"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigUtils = void 0;
const fs_1 = __importDefault(require("fs"));
class ConfigUtils {
    static getEnvVariable(key, fallback) {
        const result = process.env[key];
        if (result === undefined) {
            if (fallback !== undefined) {
                return fallback;
            }
        }
        if (result === undefined) {
            if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
                return '';
            }
            throw new Error(`missing config variable '${key}'`);
        }
        return result;
    }
    static getFileContent(path) {
        try {
            return fs_1.default.readFileSync(path);
        }
        catch (e) {
            if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
                return Buffer.from('');
            }
            throw e;
        }
    }
}
exports.ConfigUtils = ConfigUtils;
//# sourceMappingURL=configUtils.js.map