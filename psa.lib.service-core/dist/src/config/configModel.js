"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpConnection = void 0;
class HttpConnection {
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }
    get url() {
        return `http://${this.host}:${this.port}`;
    }
}
exports.HttpConnection = HttpConnection;
//# sourceMappingURL=configModel.js.map