import { MessageQueueClient } from './messageQueueClient';
import { MessageQueueTopic } from './messageQueueTopics';
import { MessageTopicMap } from './messageQueueMessage';
interface Sandbox {
    replace: <T, TKey extends keyof T>(obj: T, prop: TKey, replacement: T[TKey]) => T[TKey];
}
export declare class MessageQueueTestUtils {
    static injectMessageProcessedAwaiter<T extends MessageQueueTopic, M extends MessageTopicMap[T]>(messageQueueClient: MessageQueueClient, topic: T, sandbox?: Sandbox): Promise<{
        message: M;
        timestamp: number;
    }>;
}
export {};
