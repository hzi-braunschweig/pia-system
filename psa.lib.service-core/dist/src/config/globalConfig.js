"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfig = exports.GlobalAuthSettings = void 0;
const configUtils_1 = require("./configUtils");
const configModel_1 = require("./configModel");
class GlobalAuthSettings {
    static get keycloakHttpConnection() {
        return new configModel_1.HttpConnection(configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_PROTOCOL', 'https'), configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_HOST', 'authserver'), configUtils_1.ConfigUtils.getEnvVariableInt('AUTHSERVER_PORT'));
    }
    static get probandTokenIntrospectionClient() {
        return {
            connection: GlobalAuthSettings.keycloakHttpConnection,
            realm: 'pia-proband-realm',
            clientId: 'pia-proband-token-introspection-client',
            secret: configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET'),
        };
    }
    static get probandManagementClient() {
        return {
            connection: GlobalAuthSettings.keycloakHttpConnection,
            realm: 'pia-proband-realm',
            clientId: 'pia-proband-management-client',
            secret: configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_PROBAND_MANAGEMENT_CLIENT_SECRET'),
        };
    }
    static get adminTokenIntrospectionClient() {
        return {
            connection: GlobalAuthSettings.keycloakHttpConnection,
            realm: 'pia-admin-realm',
            clientId: 'pia-admin-token-introspection-client',
            secret: configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET'),
        };
    }
    static get adminManagementClient() {
        return {
            connection: GlobalAuthSettings.keycloakHttpConnection,
            realm: 'pia-admin-realm',
            clientId: 'pia-admin-management-client',
            secret: configUtils_1.ConfigUtils.getEnvVariable('AUTHSERVER_ADMIN_MANAGEMENT_CLIENT_SECRET'),
        };
    }
}
exports.GlobalAuthSettings = GlobalAuthSettings;
class GlobalConfig {
    static get complianceservice() {
        return GlobalConfig.getHttpConnection('COMPLIANCESERVICE');
    }
    static get loggingservice() {
        return GlobalConfig.getHttpConnection('LOGGINGSERVICE');
    }
    static get personaldataservice() {
        return GlobalConfig.getHttpConnection('PERSONALDATASERVICE');
    }
    static get questionnaireservice() {
        return GlobalConfig.getHttpConnection('QUESTIONNAIRESERVICE');
    }
    static get userservice() {
        return GlobalConfig.getHttpConnection('USERSERVICE');
    }
    static get timeZone() {
        return configUtils_1.ConfigUtils.getEnvVariable('APPLICATION_TIMEZONE', 'Europe/Berlin');
    }
    static get mailserver() {
        return {
            host: configUtils_1.ConfigUtils.getEnvVariable('MAIL_HOST'),
            port: Number(configUtils_1.ConfigUtils.getEnvVariable('MAIL_PORT')),
            user: configUtils_1.ConfigUtils.getEnvVariable('MAIL_USER', ''),
            password: configUtils_1.ConfigUtils.getEnvVariable('MAIL_PASSWORD', ''),
            requireTLS: configUtils_1.ConfigUtils.getEnvVariable('MAIL_REQUIRE_TLS', 'true').toLowerCase() !==
                'false',
            from: configUtils_1.ConfigUtils.getEnvVariable('MAIL_FROM_ADDRESS'),
            name: configUtils_1.ConfigUtils.getEnvVariable('MAIL_FROM_NAME'),
        };
    }
    static get probandAppUrl() {
        return configUtils_1.ConfigUtils.getEnvVariable('WEBAPP_URL');
    }
    static get adminAppUrl() {
        return (this.probandAppUrl +
            (this.probandAppUrl.endsWith('/') ? 'admin' : '/admin'));
    }
    static getInternal(serviceName) {
        return {
            host: '0.0.0.0',
            port: GlobalConfig.getPort(serviceName, 'INTERNAL_'),
        };
    }
    static getPublic(sslCerts, serviceName) {
        return {
            host: '0.0.0.0',
            port: GlobalConfig.getPort(serviceName),
            tls: configUtils_1.ConfigUtils.getEnvVariable('PROTOCOL', 'https') !== 'http' && {
                cert: sslCerts.cert,
                key: sslCerts.key,
                rejectUnauthorized: true,
            },
        };
    }
    static getQPia(sslCerts) {
        return {
            host: configUtils_1.ConfigUtils.getEnvVariable('QPIA_HOST'),
            port: Number(configUtils_1.ConfigUtils.getEnvVariable('QPIA_PORT')),
            user: configUtils_1.ConfigUtils.getEnvVariable('QPIA_USER'),
            password: configUtils_1.ConfigUtils.getEnvVariable('QPIA_PASSWORD'),
            database: configUtils_1.ConfigUtils.getEnvVariable('QPIA_DB'),
            ssl: {
                rejectUnauthorized: configUtils_1.ConfigUtils.getEnvVariable('QPIA_ACCEPT_UNAUTHORIZED', 'false') !==
                    'true',
                cert: sslCerts.cert,
                key: sslCerts.key,
                ca: sslCerts.ca,
            },
        };
    }
    static getMessageQueue(serviceName) {
        return {
            host: configUtils_1.ConfigUtils.getEnvVariable('MESSAGEQUEUE_HOST'),
            port: configUtils_1.ConfigUtils.getEnvVariableInt('MESSAGEQUEUE_PORT'),
            serviceName,
            username: configUtils_1.ConfigUtils.getEnvVariable('MESSAGEQUEUE_APP_USER'),
            password: configUtils_1.ConfigUtils.getEnvVariable('MESSAGEQUEUE_APP_PASSWORD'),
        };
    }
    static isDevelopmentSystem() {
        return (configUtils_1.ConfigUtils.getEnvVariable('IS_DEVELOPMENT_SYSTEM', 'false').toLowerCase() === 'true');
    }
    static isTest() {
        return configUtils_1.ConfigUtils.getEnvVariable('NODE_ENV', '').toLowerCase() === 'test';
    }
    static getHttpConnection(servicePrefix) {
        return new configModel_1.HttpConnection(configUtils_1.ConfigUtils.getEnvVariable('INTERNAL_PROTOCOL', 'http'), configUtils_1.ConfigUtils.getEnvVariable(servicePrefix + '_HOST'), Number(configUtils_1.ConfigUtils.getEnvVariable(servicePrefix + '_INTERNAL_PORT')));
    }
    static getPort(serviceName, prefix = '') {
        const port = configUtils_1.ConfigUtils.getEnvVariableInt(prefix + 'PORT', Number.NaN);
        return configUtils_1.ConfigUtils.getEnvVariableInt(`${serviceName.toUpperCase()}_${prefix}PORT`, port);
    }
}
exports.GlobalConfig = GlobalConfig;
GlobalConfig.authserver = GlobalAuthSettings;
//# sourceMappingURL=globalConfig.js.map