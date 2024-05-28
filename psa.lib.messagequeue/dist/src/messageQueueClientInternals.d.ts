import * as amqp from 'amqplib';
import { MessageQueueTopic } from './messageQueueTopics';
export interface HandleMessageArgs<M> {
    message: amqp.ConsumeMessage;
    onMessage: (message: M, timestamp: Date) => Promise<void>;
    channel: amqp.Channel;
    topic: MessageQueueTopic;
    deadLetterQueue: amqp.Replies.AssertQueue;
}
