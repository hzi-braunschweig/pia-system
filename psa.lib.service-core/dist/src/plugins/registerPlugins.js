"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = exports.defaultInternalRoutesPaths = exports.defaultPublicRoutesPaths = void 0;
const good_1 = __importDefault(require("@hapi/good"));
const good_squeeze_1 = require("@hapi/good-squeeze");
const good_console_1 = __importDefault(require("@hapi/good-console"));
const hapi_router_1 = __importDefault(require("hapi-router"));
const handleFieldValidationErrors_1 = require("./handleFieldValidationErrors");
const health_1 = require("./health");
const version_1 = require("./version");
const metrics_1 = require("./metrics");
const errorHandler_1 = require("./errorHandler");
const assertStudyAccess_1 = require("./assertStudyAccess");
const logSqueezeArgs = [
    {
        log: '*',
        response: { exclude: 'nolog' },
        request: '*',
        'request-internal': '*',
    },
];
exports.defaultPublicRoutesPaths = 'src/routes/{admin,proband}/*';
exports.defaultInternalRoutesPaths = 'src/routes/internal/*';
const registerPlugins = async (server, options) => {
    await server.register([
        version_1.Version,
        health_1.Health,
        metrics_1.Metrics,
        handleFieldValidationErrors_1.HandleFieldValidationErrors,
        errorHandler_1.ErrorHandler,
        assertStudyAccess_1.AssertStudyAccess,
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
            },
        },
    });
};
exports.registerPlugins = registerPlugins;
//# sourceMappingURL=registerPlugins.js.map