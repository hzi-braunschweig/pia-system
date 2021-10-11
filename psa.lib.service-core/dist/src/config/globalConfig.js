"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfig = void 0;
const configUtils_1 = require("./configUtils");
const configModel_1 = require("./configModel");
class GlobalConfig {
    static get internal() {
        return {
            host: '0.0.0.0',
            port: Number(configUtils_1.ConfigUtils.getEnvVariable('INTERNAL_PORT')),
        };
    }
    static get authservice() {
        return GlobalConfig.getHttpConnection('AUTHSERVICE');
    }
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
    static get sormasservice() {
        return GlobalConfig.getHttpConnection('SORMASSERVICE');
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
    static get isSormasActive() {
        return (configUtils_1.ConfigUtils.getEnvVariable('IS_SORMAS_ACTIVE', 'false').toLowerCase() ===
            'true');
    }
    static get webappUrl() {
        return configUtils_1.ConfigUtils.getEnvVariable('WEBAPP_URL');
    }
    static get backendApiUrl() {
        return configUtils_1.ConfigUtils.getEnvVariable('BACKEND_API_URL');
    }
    static get publicAuthKey() {
        return configUtils_1.ConfigUtils.getFileContent('./authKey/public.pem');
    }
    static getPublic(sslCerts) {
        return {
            host: '0.0.0.0',
            port: Number(configUtils_1.ConfigUtils.getEnvVariable('PORT')),
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
    static getHttpConnection(servicePrefix) {
        return new configModel_1.HttpConnection(configUtils_1.ConfigUtils.getEnvVariable('INTERNAL_PROTOCOL', 'http'), configUtils_1.ConfigUtils.getEnvVariable(servicePrefix + '_HOST'), Number(configUtils_1.ConfigUtils.getEnvVariable(servicePrefix + '_INTERNAL_PORT')));
    }
}
exports.GlobalConfig = GlobalConfig;
//# sourceMappingURL=globalConfig.js.map