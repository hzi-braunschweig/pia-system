# Distribution notes

This file contains notes about changes that are important to the operations team.

## 1.28

- a SQL script needs to be executed prior to updating to this version on the HZI PROD instance
  - the script will be sent to the deployer in a secure manner as it contains sensitive data
  - the script will clean up specific probands' study accesses in order to allow only one study access per proband
  - this is a preparation for future changes after which it will not be possible to have probands with access to multiple studies

## 1.27

- the `pia_ip_check_enabled` and `pia_cert_check_enabled` ansible variables have been added and should be set to `true` for PIA-Prod.

The output of `docker logs authservice` should contain enabled `ipCheckEnabled` and `certCheckEnabled`:

```
08:46:27 08.10.2021, [log,startup] data: Server running at https://0.0.0.0:4000
08:46:27 08.10.2021, [log,startup] data: {"ipCheckEnabled":true,"certCheckEnabled":true}
```

## 1.26

## 1.25.1

- the ansible configuration variable `pia_mhh_ftpservice_allow_old_ssh2_kex` has to be set to `true` for PIA-Prod
- please check if the connections to the HZI ftpservice are working and if there is a KEX problem, please set `pia_hzi_ftpservice_allow_old_ssh2_kex` to `true`

## 1.25

- the configuration variable USER_PASSWORD_LENGTH should be decreased to the value "10" on all PIA instances as a
  consequence of business requirements

## 1.24

## 1.23

## 1.22

- new microservice: modysservice, replacement for externaldataservice
  - removed configuration options:
    - MODYS_USER
    - MODYS_PASSWORD
    - MODYS_DB
    - MODYS_HOST
    - MODYS_PORT
    - MODYS_SSL
    - pia_has_externaldataservice
  - new configuration options:
    - MODYS_BASE_URL (REST endpoint)
    - MODYS_USERNAME (basic auth username)
    - MODYS_PASSWORD (basic auth password)
    - MODYS_STUDY (should be "ZIFCO-Studie")
    - MODYS_IDENTIFIER_TYPE_ID
    - MODYS_REQUEST_CONCURRENCY (Optional - default is: 5 => ca. 10 requests in parallel)
    - pia_has_modysservice

## 1.21

## 1.20

- the migration scripts `pia_200_migrate_fill_study_column` and `pia_200_migrate_logs` got removed, version
  1.17/1.18/1.19 must have been started at least once on existing databases before upgrading to this version.
- A new constraint is introduced which prevents usernames from existing multiple times in different spellings. To ensure
  that the migration can be executed, it should first be checked whether there are entries that could prevent the
  migration. These would have to be deleted after consultation. If there are no problem cases, the following query will
  be empty.

  `SELECT count from (SELECT UPPER(username) as up_username, count(*) as count FROM users GROUP BY up_username HAVING count(*) > 1) as up_usernames;`

- Same constraint will be applied on planned_probands:

  `SELECT count from (SELECT UPPER(user_id) as up_username, count(*) as count FROM planned_probands GROUP BY up_username HAVING count(*) > 1) as up_usernames;`

## 1.19

- messagequeue got added
  - monitoring via metrics proxy `/messagequeue/metrics` alerting required for `rabbitmq_queue_messages` when the message count continues to increase (should stay near to zero).
- services are running as user `node` not as `root` for better security.
  - make sure every access on mounted files is possible.
  - INTERNAL_PORT cannot be under 1024
- psa.lib.service-core added
  - The warning "validateAccessToken: AccessToken will be checked without database access. This is not allowed for services with qPIA DB access!" may appear in the logs on service start. This is okay for the following services:
    - personaldataservice
    - complianceservice
    - loggingservice

## 1.18

- the api paths have changed. To get the version info you have to prefix `/api/v1`. E.g.: `/api/v1/user/version`
- ipia database port (ipiaservice:5432) should no longer be exposed

## 1.17

- introduces inter-host service communication (qPIA <-> iPIA)
  - personaldataservice is now hosted on iPIA
    - accesses qPIA services via private internal ports
      - loggingservice: 5008
      - userservice: 5001
      - authservice: 5002
    - accesses mail server
  - services in qPIA access iPIA services via private internal ports
    - personaldataservice: 5007
  - apigateway in qPIA access iPIA services via non private internal ports (routed requests from the browser)
    - personaldataservice: 4007 - `PERSONALDATASERVICE_INTERNAL_PORT`
  - new ansible variable `pia_qpia_ip` needs to be configured in order for iPIA services to reach qPIA services
- iPIA will experience major database migrations
  - all contacts-related tables will be dropped (as PIA only duplicates MODYS data, but does not need them)
  - table `t_participant` will be renamed to the more intuitive name `personal_data`
  - `deletion_logs` will be moved to loggingservice via a NodeJS based migration script
  - `personal_data` and `pending_deletions` will be cleaned up to only contain data of probands existing in qPIA via a NodeJS based migration script
  - The NodeJS based migration scripts will be executed with detailed logging prior to the service startup
    - IMPORTANT: please make sure to save this log, and note the number of deleted rows, displayed like this:
      `Study Column migration: migrated X personal_data rows and deleted Y rows'`
- personaldataservice will get its own postgres DB user

  - will be the owner of tables `personal_data` and `pending_deletions`
  - no qPIA service will continue to access the iPIA DB
  - no iPIA service will continue to access the qPIA DB
  - access to iPIA data from now on is only possible via the personaldata REST API

- `VACUUM FULL` gets executed as a cron job inside the database services (qPIA, ewPIA, iPIA). The job can take some time to complete. It is planned to be sheduled to run every sunday on 23:45. But currently it is effectivly disabled (next run 2026-03-01).
  - use `jobber log` inside the container to get a log of the last jobs
  - use `jobber list` inside the container to show a status
  - use `jobber test VacuumFull` inside the container to manually trigger the job
  - It is not certain that it won't cause problems on the first runs! It must be trigger after the next update while someone is able to watch it and the time it takes should be measured!

## 1.16

- the ansible variables `pia_ewpia_password`, `pia_ipia_password`, `pia_qpia_password` and `pia_db_log_password` are generated by the playbook and should not be overwritten.

## 1.15

## 1.14

- before the update, [the migration check](./psa.database.ewpia/check-scripts/before_1.14.0.sql) must be executed to
  validate that a migration is possible.
- the apigateway needs the `ca.cert` to validate the microservices.
- it is possible to provide no auth info for smtp.
- the following migration script needs be executed on ipia database instances:
  - `UPDATE t_participant SET plz=concat('0',plz) WHERE length(plz)=4;`

## 1.13

- the externaldataservice supports SSL encryption to the Modys-DB and therefore needs certificates
- new Firebase-Credentials are required
