import { MessageQueueClientConnection } from './messageQueueClientConnection';
import { MessageQueueTopic } from './messageQueueTopics';
export interface Producer<M> {
    publish: (message: M) => Promise<boolean>;
}
export declare class MessageQueueClient extends MessageQueueClientConnection {
    protected readonly serviceName: string;
    constructor({ serviceName, host, port, username, password, }: {
        serviceName: string;
        host: string;
        port?: number;
        username: string;
        password: string;
    });
    createProducer<M>(topic: MessageQueueTopic): Promise<Producer<M>>;
    removeQueue(topic: MessageQueueTopic): Promise<void>;
    removeQueues(topics: MessageQueueTopic[]): Promise<void>;
    createConsumer<M>(topic: MessageQueueTopic, onMessage: (message: M) => Promise<void>): Promise<void>;
    private handleMessage;
}
