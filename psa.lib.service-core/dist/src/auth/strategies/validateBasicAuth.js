"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBasicAuth = void 0;
const Boom = __importStar(require("@hapi/boom"));
const blockedIPService_1 = require("../blockedIPService");
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_TO_WAIT = 300;
const MAX_WRONG_ATTEMPTS = 3;
const MAX_LRU_CACHE_SIZE = 1000;
function validateBasicAuth(basicUsername, basicPassword) {
    const blockedIPService = new blockedIPService_1.BlockedIPService(MAX_LRU_CACHE_SIZE);
    return function (request, username, password) {
        const xFF = request.headers['x-forwarded-for'];
        const forwardedForAdresses = xFF?.split(',');
        const ip = forwardedForAdresses?.length && forwardedForAdresses[0]
            ? forwardedForAdresses[0]
            : request.info.remoteAddress;
        const blockedIP = blockedIPService.get(ip);
        if (blockedIP.number_of_wrong_attempts >= MAX_WRONG_ATTEMPTS &&
            blockedIP.third_wrong_password_at) {
            const timeSinceLastWrongAttemptSec = Math.floor((Date.now() - blockedIP.third_wrong_password_at) /
                MILLISECONDS_PER_SECOND);
            const remainingTime = SECONDS_TO_WAIT - timeSinceLastWrongAttemptSec;
            if (remainingTime > 0) {
                throw Boom.forbidden(`User has 3 failed login attempts and is banned for ${remainingTime} seconds`);
            }
        }
        if (username === basicUsername && password === basicPassword) {
            return { isValid: true, credentials: { name: username } };
        }
        else {
            blockedIP.number_of_wrong_attempts += 1;
            blockedIP.third_wrong_password_at = Date.now();
            blockedIPService.put(ip, blockedIP);
            return { isValid: false };
        }
    };
}
exports.validateBasicAuth = validateBasicAuth;
//# sourceMappingURL=validateBasicAuth.js.map