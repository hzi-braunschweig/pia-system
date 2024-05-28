"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Health = void 0;
const http_status_codes_1 = require("http-status-codes");
exports.Health = {
    name: 'health',
    version: '1.0.0',
    register: function (server) {
        server.route({
            method: 'GET',
            path: '/health',
            handler: async (_, h) => {
                const response = h.response('').type('text/plain').code(http_status_codes_1.StatusCodes.OK);
                try {
                    if (!server.settings.app?.healthcheck ||
                        !(await server.settings.app.healthcheck())) {
                        response.code(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE);
                    }
                }
                catch (err) {
                    response.code(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE);
                }
                return response;
            },
            config: {
                tags: ['nolog'],
            },
        });
    },
};
//# sourceMappingURL=health.js.map