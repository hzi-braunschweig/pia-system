# psa.server.eventhistory

Saves certain messages from the message queue as events. See [./src/events.ts](./src/events.ts) for the list of topics, which are consumed and saved.

## Getting Started

### Development

See [development documentation](../docs/development.md).

### Test

- Install dependencies `npm install`
- Run integration tests `npm run test.int`

## Remove old events

The cronjob is defined with the service deployment and can be viewed and configured there.

### Running the job manually

Remember to adjust the namespace used in your own environment.

#### Run the CLI command in your deployed service

```bash
kubectl -n pia exec -it deployment/eventhistoryserver -- npm run cli -- remove-old-events
```

#### Create a new job from the cronjob

```bash
kubectl -n pia create job --from=cronjob/eventhistoryserver-remove-old-events eventhistoryserver-remove-old-events
# check the job status and wait for it to complete
kubectl -n pia delete job eventhistoryserver-remove-old-events
```
