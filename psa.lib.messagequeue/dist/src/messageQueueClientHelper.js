"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.MessageQueueClientHelper = void 0;
const util = __importStar(require("util"));
const amqp = __importStar(require("amqplib"));
const delay = util.promisify(setTimeout);
class MessageQueueClientHelper {
    static getQueueName(topic, serviceName) {
        return `${topic}@${serviceName}`;
    }
    static getDeadLetterQueueName(topic, serviceName) {
        return `${topic}@${serviceName}-dead-letter`;
    }
    static async waitForAvailability(options) {
        for (;;) {
            try {
                const connection = await amqp.connect({
                    hostname: options.host,
                    port: options.port,
                    username: options.username,
                    password: options.password,
                });
                await connection.close();
                return;
            }
            catch {
                await delay(this.DELAY_TIME);
            }
        }
    }
}
exports.MessageQueueClientHelper = MessageQueueClientHelper;
MessageQueueClientHelper.DELAY_TIME = 10;
//# sourceMappingURL=messageQueueClientHelper.js.map