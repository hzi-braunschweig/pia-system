import * as amqp from 'amqplib';
export interface HandleMessageArgs<M> {
    message: amqp.ConsumeMessage;
    onMessage: (message: M) => Promise<void>;
    channel: amqp.Channel;
    topic: string;
    deadLetterQueue: amqp.Replies.AssertQueue;
}
