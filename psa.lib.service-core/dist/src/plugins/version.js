"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
exports.Version = {
    name: 'version-info',
    version: '1.0.0',
    register: function (server) {
        if (process.env['ROUTE_PREFIX'] === undefined) {
            throw new Error('env variable "ROUTE_PREFIX" must be configured for version route');
        }
        const prefix = 'VERSION_INFO_';
        const response = Object.fromEntries(Object.entries(process.env)
            .filter(([key, value]) => key.startsWith(prefix) && value && value !== '')
            .filter(([key, value]) => key.startsWith(prefix) && value && value !== '')
            .map(([key, value]) => [key.substring(prefix.length), value]));
        server.route({
            method: 'GET',
            path: process.env['ROUTE_PREFIX'] + '/version',
            handler: () => {
                return response;
            },
        });
    },
};
//# sourceMappingURL=version.js.map