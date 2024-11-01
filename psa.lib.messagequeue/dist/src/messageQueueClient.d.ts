import { MessageQueueClientConnection } from './messageQueueClientConnection';
import { HandleMessageArgs } from './messageQueueClientInternals';
import { MessageQueueTopic } from './messageQueueTopics';
import { MessageTopicMap } from './messageQueueMessage';
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
    createProducer<M extends MessageTopicMap[T], T extends MessageQueueTopic>(topic: T): Promise<Producer<M>>;
    removeQueue(topic: MessageQueueTopic): Promise<void>;
    removeQueues(topics: MessageQueueTopic[]): Promise<void>;
    createConsumer<T extends MessageQueueTopic, M extends MessageTopicMap[T]>(topic: T, onMessage: HandleMessageArgs<M>['onMessage']): Promise<void>;
    private handleMessage;
}
