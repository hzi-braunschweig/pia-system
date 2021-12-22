import * as amqp from 'amqplib';
export declare class MessageQueueClientConnection {
    private readonly options;
    protected connection: amqp.Connection | null;
    constructor(options: {
        host: string;
        port?: number;
        username: string;
        password: string;
    });
    isConnected(): boolean;
    connect(waitForAvailability?: boolean): Promise<void>;
    disconnect(): Promise<void>;
}
