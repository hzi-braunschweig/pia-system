"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = void 0;
const inert_1 = __importDefault(require("@hapi/inert"));
const vision_1 = __importDefault(require("@hapi/vision"));
const hapi_swagger_1 = __importDefault(require("hapi-swagger"));
const good_1 = __importDefault(require("@hapi/good"));
const good_squeeze_1 = require("@hapi/good-squeeze");
const good_console_1 = __importDefault(require("@hapi/good-console"));
const rotating_file_stream_1 = require("rotating-file-stream");
const hapi_router_1 = __importDefault(require("hapi-router"));
const version_1 = require("./version");
const metrics_1 = require("./metrics");
const logSqueezeArgs = [
    {
        log: '*',
        response: { exclude: 'nolog' },
        request: '*',
        'request-internal': '*',
    },
];
const registerPlugins = async (server, options) => {
    await server.register([
        inert_1.default,
        vision_1.default,
        version_1.Version,
        metrics_1.Metrics,
    ]);
    if (options.routes) {
        await server.register({
            plugin: hapi_router_1.default,
            options: {
                routes: options.routes,
                ignore: ['**/*.d.ts', '**/*.js.map'],
            },
        });
    }
    await server.register({
        plugin: good_1.default,
        options: {
            reporters: {
                console: [
                    {
                        module: good_squeeze_1.Squeeze,
                        args: logSqueezeArgs,
                    },
                    {
                        module: good_console_1.default,
                        args: [
                            {
                                format: 'HH:mm:ss DD.MM.YYYY',
                                utc: false,
                            },
                        ],
                    },
                    'stdout',
                ],
                file: [
                    {
                        module: good_squeeze_1.Squeeze,
                        args: logSqueezeArgs,
                    },
                    {
                        module: good_squeeze_1.SafeJson,
                    },
                    {
                        module: rotating_file_stream_1.createStream,
                        args: [
                            'log',
                            {
                                interval: '1d',
                                compress: 'gzip',
                                path: './logs',
                            },
                        ],
                    },
                ],
            },
        },
    });
    await server.register({
        plugin: hapi_swagger_1.default,
        options: {
            documentationPage: true,
            info: {
                title: `API Documentation ${options.name}${options.isInternal ? ' Internal' : ''}`,
                version: options.version,
            },
            securityDefinitions: {
                jwt: {
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header',
                },
            },
            security: [{ jwt: [] }],
        },
    });
};
exports.registerPlugins = registerPlugins;
//# sourceMappingURL=registerPlugins.js.map