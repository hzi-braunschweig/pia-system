import { MessageQueueClientConnection } from './messageQueueClientConnection';
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
    createProducer<M>(topic: string): Promise<Producer<M>>;
    removeQueue(topic: string): Promise<void>;
    removeQueues(topics: string[]): Promise<void>;
    createConsumer<M>(topic: string, onMessage: (message: M) => Promise<void>): Promise<void>;
    private handleMessage;
}
