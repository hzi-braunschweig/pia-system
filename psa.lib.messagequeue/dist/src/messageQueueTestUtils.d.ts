import { MessageQueueClient } from './messageQueueClient';
import { MessageQueueTopic } from './messageQueueTopics';
interface Sandbox {
    replace: <T, TKey extends keyof T>(obj: T, prop: TKey, replacement: T[TKey]) => T[TKey];
}
export declare class MessageQueueTestUtils {
    static injectMessageProcessedAwaiter(messageQueueClient: MessageQueueClient, topic: MessageQueueTopic, sandbox?: Sandbox): Promise<void>;
}
export {};
