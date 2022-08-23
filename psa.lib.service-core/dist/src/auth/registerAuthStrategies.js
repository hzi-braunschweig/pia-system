"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthStrategies = void 0;
const hapi_auth_keycloak_1 = __importDefault(require("hapi-auth-keycloak"));
const globalConfig_1 = require("../config/globalConfig");
async function registerAuthStrategies(server, authSettings) {
    if (!authSettings.probandTokenIntrospectionClient &&
        !authSettings.adminTokenIntrospectionClient) {
        console.warn('registerAuthStrategies() was called without valid realm configuration!');
        console.warn('Did not register any auth strategy');
        return;
    }
    const userInfo = ['username', 'studies'];
    await server.register({ plugin: hapi_auth_keycloak_1.default });
    if (authSettings.probandTokenIntrospectionClient) {
        server.auth.strategy('jwt-proband', 'keycloak-jwt', {
            name: 'jwt-proband',
            userInfo,
            realmUrl: `${authSettings.probandTokenIntrospectionClient.connection.url}/realms/${authSettings.probandTokenIntrospectionClient.realm}`,
            clientId: authSettings.probandTokenIntrospectionClient.clientId,
            secret: authSettings.probandTokenIntrospectionClient.secret,
            cache: !globalConfig_1.GlobalConfig.isTest() ? { segment: 'keycloakJwtProband' } : false,
        });
        console.info('Registered "jwt-proband" auth strategy');
    }
    if (authSettings.adminTokenIntrospectionClient) {
        server.auth.strategy('jwt-admin', 'keycloak-jwt', {
            name: 'jwt-admin',
            userInfo,
            realmUrl: `${authSettings.adminTokenIntrospectionClient.connection.url}/realms/${authSettings.adminTokenIntrospectionClient.realm}`,
            clientId: authSettings.adminTokenIntrospectionClient.clientId,
            secret: authSettings.adminTokenIntrospectionClient.secret,
            cache: !globalConfig_1.GlobalConfig.isTest() ? { segment: 'keycloakJwtAdmin' } : false,
        });
        console.info('Registered "jwt-admin" auth strategy');
    }
}
exports.registerAuthStrategies = registerAuthStrategies;
//# sourceMappingURL=registerAuthStrategies.js.map