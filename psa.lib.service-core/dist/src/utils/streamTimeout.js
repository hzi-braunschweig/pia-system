"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamTimeout = void 0;
const stream_1 = require("stream");
class StreamTimeout extends stream_1.Transform {
    constructor(timeout) {
        super();
        this.timeout = setTimeout(() => {
            console.warn(`Stream timeout reached after ${timeout}ms. Closing stream.`);
            this.end();
            this.destroy();
        }, timeout);
    }
    _transform(chunk, _encoding, callback) {
        this.push(chunk);
        callback();
    }
    _flush(callback) {
        clearTimeout(this.timeout);
        callback();
    }
}
exports.StreamTimeout = StreamTimeout;
//# sourceMappingURL=streamTimeout.js.map