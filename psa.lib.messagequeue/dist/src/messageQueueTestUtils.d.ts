import { MessageQueueClient } from './messageQueueClient';
interface Sandbox {
    replace: <T, TKey extends keyof T>(obj: T, prop: TKey, replacement: T[TKey]) => T[TKey];
}
export declare class MessageQueueTestUtils {
    static injectMessageProcessedAwaiter(messageQueueClient: MessageQueueClient, topic: string, sandbox?: Sandbox): Promise<void>;
}
export {};
