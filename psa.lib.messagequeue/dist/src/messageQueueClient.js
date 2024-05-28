"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueClient = void 0;
const messageQueueClientConnection_1 = require("./messageQueueClientConnection");
const messageQueueClientHelper_1 = require("./messageQueueClientHelper");
const exchangeType = 'fanout';
const exchangeOptions = {
    durable: true,
};
const queueOptions = {
    exclusive: false,
    durable: true,
    autoDelete: false,
};
const contentEncoding = 'utf-8';
const publishOptions = {
    persistent: true,
    contentType: 'application/json',
    contentEncoding,
};
const HTTP_NOT_FOUND = 404;
class MessageQueueClient extends messageQueueClientConnection_1.MessageQueueClientConnection {
    constructor({ serviceName, host, port, username, password, }) {
        super({
            host,
            port,
            username,
            password,
        });
        this.serviceName = serviceName;
    }
    async createProducer(topic) {
        if (!this.connection) {
            throw new Error('not connected');
        }
        const channel = await this.connection.createChannel();
        await channel.assertExchange(topic, exchangeType, exchangeOptions);
        return {
            publish: async (message) => {
                const content = Buffer.from(JSON.stringify({ message }), contentEncoding);
                return Promise.resolve(channel.publish(topic, this.serviceName, content, {
                    ...publishOptions,
                    timestamp: Date.now(),
                }));
            },
        };
    }
    async removeQueue(topic) {
        if (!this.connection) {
            throw new Error('not connected');
        }
        const queueName = messageQueueClientHelper_1.MessageQueueClientHelper.getQueueName(topic, this.serviceName);
        const channel = await this.connection.createChannel();
        channel.on('error', () => {
        });
        let queue;
        try {
            queue = await channel.checkQueue(queueName);
        }
        catch (error) {
            if (error && error.code === HTTP_NOT_FOUND) {
                return;
            }
            throw error;
        }
        if (queue.messageCount > 0) {
            console.warn(`messages remaining on ${queueName}: ${queue.messageCount} - we will just unlink it`);
            await channel.unbindQueue(queueName, topic, '*');
        }
        else {
            console.log(`deleting queue ${queueName}`);
            await channel.deleteQueue(queueName);
        }
        await channel.close();
    }
    async removeQueues(topics) {
        for (const topic of topics) {
            await this.removeQueue(topic);
        }
    }
    async createConsumer(topic, onMessage) {
        if (!this.connection) {
            throw new Error('not connected');
        }
        const channel = await this.connection.createChannel();
        await channel.assertExchange(topic, exchangeType, {
            durable: true,
        });
        const queue = await channel.assertQueue(messageQueueClientHelper_1.MessageQueueClientHelper.getQueueName(topic, this.serviceName), queueOptions);
        const deadLetterQueue = await channel.assertQueue(messageQueueClientHelper_1.MessageQueueClientHelper.getDeadLetterQueueName(topic, this.serviceName), queueOptions);
        await channel.bindQueue(queue.queue, topic, '*');
        await channel.consume(queue.queue, (message) => {
            if (!message) {
                return;
            }
            void this.handleMessage({
                message,
                onMessage,
                channel,
                topic,
                deadLetterQueue,
            });
        });
    }
    async handleMessage(args) {
        const redelivered = args.message.fields.redelivered;
        try {
            const properties = args.message.properties;
            const data = JSON.parse(args.message.content.toString());
            await args.onMessage(data.message, new Date(properties.timestamp));
            args.channel.ack(args.message, false);
        }
        catch {
            if (redelivered) {
                console.error(`dropping message on ${args.topic} to dead-letter-queue`);
                args.channel.sendToQueue(args.deadLetterQueue.queue, args.message.content, publishOptions);
                args.channel.ack(args.message, false);
            }
            else {
                args.channel.nack(args.message, false, !redelivered);
            }
        }
    }
}
exports.MessageQueueClient = MessageQueueClient;
//# sourceMappingURL=messageQueueClient.js.map