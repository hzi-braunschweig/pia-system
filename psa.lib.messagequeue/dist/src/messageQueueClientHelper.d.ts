export declare class MessageQueueClientHelper {
    private static readonly DELAY_TIME;
    static getQueueName(topic: string, serviceName: string): string;
    static getDeadLetterQueueName(topic: string, serviceName: string): string;
    static waitForAvailability(options: {
        host: string;
        port?: number;
        username: string;
        password: string;
    }): Promise<void>;
}
