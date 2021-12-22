"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthStrategies = void 0;
const hapi_auth_jwt2_1 = __importDefault(require("hapi-auth-jwt2"));
const validateAccessToken_1 = require("./strategies/validateAccessToken");
const validateLoginToken_1 = require("./strategies/validateLoginToken");
const registerAuthStrategies = async (server, options) => {
    if (!options.strategies.length) {
        throw new Error('registerAuthStrategies: No auth strategies defined!');
    }
    if (!options.publicAuthKey) {
        throw new Error('registerAuthStrategies: No public auth key defined!');
    }
    if (options.strategies.includes('jwt') ||
        options.strategies.includes('jwt_login')) {
        await server.register(hapi_auth_jwt2_1.default);
    }
    if (options.strategies.includes('jwt')) {
        server.auth.strategy('jwt', 'jwt', {
            key: options.publicAuthKey,
            verifyOptions: {
                algorithms: ['RS512'],
            },
            validate: (0, validateAccessToken_1.validateAccessToken)(options.db),
        });
    }
    if (options.strategies.includes('jwt_login')) {
        server.auth.strategy('jwt_login', 'jwt', {
            key: options.publicAuthKey,
            verifyOptions: {
                algorithms: ['RS512'],
            },
            validate: (0, validateLoginToken_1.validateLoginToken)(options.db),
        });
    }
};
exports.registerAuthStrategies = registerAuthStrategies;
//# sourceMappingURL=registerAuthStrategies.js.map