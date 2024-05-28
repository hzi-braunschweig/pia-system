"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metrics = void 0;
const hapi_1 = require("@promster/hapi");
const prom_client_1 = __importDefault(require("prom-client"));
const upPlugin = (0, hapi_1.createPlugin)();
exports.Metrics = {
    name: 'metrics',
    version: '1.0.0',
    register: function (server) {
        void server.register(upPlugin);
        server.route({
            method: 'GET',
            path: '/metrics',
            handler: async (_, h) => {
                try {
                    if (!server.settings.app?.healthcheck ||
                        !(await server.settings.app.healthcheck())) {
                        throw new Error('healthcheck failed');
                    }
                    (0, hapi_1.signalIsUp)();
                }
                catch (err) {
                    console.error(err);
                    (0, hapi_1.signalIsNotUp)();
                }
                return h
                    .response(await prom_client_1.default.register.metrics())
                    .type(prom_client_1.default.register.contentType);
            },
            config: {
                tags: ['nolog'],
            },
        });
    },
};
//# sourceMappingURL=metrics.js.map