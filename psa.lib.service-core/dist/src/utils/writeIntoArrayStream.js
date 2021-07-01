"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteIntoArrayStream = void 0;
const stream_1 = require("stream");
class WriteIntoArrayStream extends stream_1.Writable {
    constructor(array) {
        super({ objectMode: true });
        this.array = array;
    }
    _write(chunk, _encoding, callback) {
        this.array.push(chunk);
        callback();
    }
}
exports.WriteIntoArrayStream = WriteIntoArrayStream;
//# sourceMappingURL=writeIntoArrayStream.js.map