"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueClientConnection = void 0;
const amqp = __importStar(require("amqplib"));
const messageQueueClientHelper_1 = require("./messageQueueClientHelper");
class MessageQueueClientConnection {
    constructor(options) {
        this.options = options;
        this.connection = null;
    }
    isConnected() {
        return this.connection !== null;
    }
    async connect(waitForAvailability = true) {
        if (this.connection) {
            throw new Error('already connected');
        }
        if (waitForAvailability) {
            await messageQueueClientHelper_1.MessageQueueClientHelper.waitForAvailability(this.options);
        }
        this.connection = await amqp.connect({
            hostname: this.options.host,
            port: this.options.port,
            username: this.options.username,
            password: this.options.password,
        });
        this.connection.once('close', () => {
            this.connection = null;
        });
    }
    async disconnect() {
        if (!this.connection) {
            throw new Error('not connected');
        }
        this.connection.removeAllListeners();
        await this.connection.close();
        this.connection = null;
    }
}
exports.MessageQueueClientConnection = MessageQueueClientConnection;
//# sourceMappingURL=messageQueueClientConnection.js.map