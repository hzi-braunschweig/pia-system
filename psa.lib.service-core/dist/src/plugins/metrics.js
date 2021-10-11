"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metrics = void 0;
const hapi_1 = require("@promster/hapi");
const prom_client_1 = __importDefault(require("prom-client"));
const boom_1 = __importDefault(require("@hapi/boom"));
const upPlugin = (0, hapi_1.createPlugin)();
exports.Metrics = {
    name: 'metrics',
    version: '1.0.0',
    register: function (server) {
        const ipWhitelist = (process.env['METRICS_IP_WHITELIST'] ?? '').split(',');
        const allAllowed = ipWhitelist.includes('*');
        void server.register(upPlugin);
        server.route({
            method: 'GET',
            path: '/metrics',
            handler: async (request, h) => {
                if (!allAllowed && !ipWhitelist.includes(request.info.remoteAddress)) {
                    return boom_1.default.unauthorized('ip address not whitelisted for metrics');
                }
                try {
                    if (!server.settings.app ||
                        !server.settings.app.healthcheck ||
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