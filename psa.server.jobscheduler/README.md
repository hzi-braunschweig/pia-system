# psa.server.jobscheduler

The jobscheduler is responsible for triggering scheduled jobs by publishing messages for a specific topic on the message queue.

Topics representing jobs and their cron configuration are set up in [src/crontab.ts](./src/crontab.ts).

## Scheduling new jobs

1. Create a topic in `psa.lib.messagequeue`: `job.<service>.<command>`
2. Add the new topic in [src/cronTable.ts](./src/cronTable.ts) and define the interval for publishing the message
3. Create a consumer for the new topic in the service that should run the job and implement the job logic
