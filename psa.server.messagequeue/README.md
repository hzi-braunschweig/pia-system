# psa.server.messagequeue

The message queue server is using the RabbitMQ server with the management plugin enabled.

## Management Plugin

The management plugin can be used to manage and monitor a RabbitMQ server instance.

### Connecting to the Management plugin

To access the management interface locally, use kubectl port forwarding:

```bash
kubectl port-forward service/messagequeue 15672:15672 -n pia
```

A graphical user interface is provided on `http://localhost:15672`. Alternatively, a CLI tool can be downloaded from `http://localhost:15672/cli/rabbitmqadmin`. The CLI tool can be started by the command `python rabbitmqadmin --help`.

The login credentials are:

- Username: `admin`
- Password: The value of `messagequeue_admin.password` from the [internal-secrets.yaml](/k8s/deployment/overlays/local-k3d/internal-secrets.yaml).

### Using the GUI

The management plugin GUI can be usded to view and manage queues, exchanges, connections, and other aspects of the RabbitMQ instance. E.g., the messages in a queue can be listed in the `Queues` tab. Consuming the messages from the queue is destructive. If the message should not be removed from the queue, the Ack Mode `Nack message requeue true` should be selected. The message will be put back into the queue in place, but the attribute `redelivered` will be set.

To move messages from one queue to another, the `shovel plugin` can be used, e.g. to requeue messages from a dead letter queue.

### Using the REST API

Inside the container it is possible to use the [REST API](https://rawcdn.githack.com/rabbitmq/rabbitmq-server/v3.12.8/deps/rabbitmq_management/priv/www/api/index.html).

For example:

```
curl -X POST --data-binary '{"count":5,"ackmode":"ack_requeue_true","encoding":"auto","truncate":50000}' -i -u admin:$MESSAGEQUEUE_ADMIN_PASSWORD http://localhost:15672/api/queues/%2F/keycloak.events%40ProbandEmailVerifiedProxy/get
```
