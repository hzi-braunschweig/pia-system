"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = exports.getSecretOrPrivateKey = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getSecretOrPrivateKey(basePath) {
    return fs_1.default.readFileSync(path_1.default.join(basePath, '../private.key'));
}
exports.getSecretOrPrivateKey = getSecretOrPrivateKey;
function signToken(payload, secret) {
    return jsonwebtoken_1.default.sign(payload, secret, {
        algorithm: 'RS512',
        expiresIn: '24h',
    });
}
exports.signToken = signToken;
//# sourceMappingURL=testUtils.js.map