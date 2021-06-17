# psa.lib.messagequeue

MessageQueue lib is using the amqp protocol to implements a reliable Service2Service event system.
It uses message queues to provide a producer and consumer concept.

Every producer is creating one `exchange` per topic.
Per each consuming service type **and** topic a `queue` is created.
This `queue` can be consumed by multiple consumers, of the same service type, concurrently.

Therefore, a message can be handled by multiple different services types, but only by one instance of each service type.

```
                          / Consumer @ serviceA instance0
                  ---- [queue]
                 /        \ Consumer @ serviceA instance1
Producer -> [exchange]
                 \        / Consumer @ serviceB instance0
                  ---- [queue]
                          \ Consumer @ serviceB instance1
```

## Usage guidelines

0. Instantiate and connect one `MessageQueueClient` on service initialisation.
1. Create only one `Consumer` using `createConsumer` per topic.
2. Create `Consumer` in the initialisation of the service.
3. Create only one `Producer` using `createProducer` per topic.
4. If a message could not be handled by a `Consumer`, throw an exception in the callback.
5. The payload of a message should only contain the most basic infos (e.g. an ID of an DB-object or a username)
6. The topic should be not too specific. For example `user-created` is fine, `user-of-study-${study}-created` would be too specific.
7. The healthcheck of a service should use the `isConnected` result of the `MessageQueueClient`
8. Disconnect the `MessageQueueClient` instance on service shutdown.

## Example

```javascript
// instantiate the client in the service initialisation
const mq = new MessageQueueClient({
  serviceName: 'testservice',
  hostname: 'localhost',
});

// and connect it in the service initialisation
await mq.connect();

// create one consumer per topic the service is interested in
await mq.createConsumer('test-topic', async (message) => {
  // handle the message payload
  console.log({
    received: message,
  });
});

// create one producer per topic that can be emitted
const producer = await mq.createProducer('test-topic');

// emit a message
await producer.publish({
  myCustomPayload: 1234,
});
```

## FAQ

Q:
_What happens when the message queue host is not available?_

A:
A `consumer` will not receive messages anymore.
Even if the message queue is reachable again.
Any `publish` call in a `producer` will throw an exception.
A reconnect could be implemented by this library in the future.

Q:
_What will happen when a message is sent before a queue is bound_

A:
This will result in a lost message.
In practice this shouldn't happen because `Consumers` should bind at the start and the binding is persistent.

Q:
_What happens if the `consumer` is unable to process a message and throws an exception_

A:
The message will be enqueued again.
If it still can not be processed, the message will be put on a dead-letter-queue.
Currently, there is no further processing of messages on the dead-letter-queue.
