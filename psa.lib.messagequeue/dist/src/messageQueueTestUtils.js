"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueTestUtils = void 0;
class MessageQueueTestUtils {
    static async injectMessageProcessedAwaiter(messageQueueClient, topic, sandbox) {
        return new Promise((resolve) => {
            const mqcp = messageQueueClient;
            const original = mqcp.handleMessage;
            const replacement = async (args) => {
                await original(args);
                if (args.topic === topic) {
                    if (!sandbox) {
                        mqcp.handleMessage = original;
                    }
                    const data = JSON.parse(args.message.content.toString());
                    resolve({
                        message: data.message,
                        timestamp: args.message.properties.timestamp,
                    });
                }
            };
            if (sandbox) {
                sandbox.replace(mqcp, 'handleMessage', replacement);
            }
            else {
                mqcp.handleMessage = replacement;
            }
        });
    }
}
exports.MessageQueueTestUtils = MessageQueueTestUtils;
//# sourceMappingURL=messageQueueTestUtils.js.map