"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpConnection = void 0;
class HttpConnection {
    constructor(protocol, host, port) {
        this.protocol = protocol;
        this.host = host;
        this.port = port;
    }
    get url() {
        return `${this.protocol}://${this.host}:${this.port}`;
    }
}
exports.HttpConnection = HttpConnection;
//# sourceMappingURL=configModel.js.map