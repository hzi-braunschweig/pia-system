# Distribution notes

This file contains notes about changes that are important to the operations team.

## 1.30 (Keycloak)

This release introduces a Keycloak server for authentication and authorization management. It replaces
the former authservice, which was deleted.

To move accounts from **qPIA** to the new Keycloak DB in **iPIA**, two different migration steps will take place:

1. All pseudonyms and usernames in the qPIA, iPIA and ewPIA DBs will be migrated to lowercase characters
2. The userservice will migrate existing accounts from the `accounts` table to Keycloak on startup

Please check the logs of the databases and the userservice while starting up.

We do expect this process to take place without any need for intervention. However, the following checks
should be executed **prior to the update** to get sure we have no unique constraint issues while running
migration step 1:

- check, that no username exists in both upper and lower case in **qPIA**:

```sql
SELECT count FROM (SELECT UPPER(username) as up_username, count(*) as count FROM accounts GROUP BY up_username HAVING count(*) > 1) as up_usernames;
```

- check, that no pseudonym exists in both upper and lower case in **qPIA**:

```sql
SELECT count FROM (SELECT UPPER(pseudonym) as up_pseudonym, count(*) as count FROM probands GROUP BY up_pseudonym HAVING count(*) > 1) as up_pseudonyms;
```

In case the second step of the migration fails, you can retry it or roll back:

- to retry the migration for users that were not migrated successfully, apply the following sql on **qPIA** before restarting the `userservice`:

```sql
UPDATE accounts SET is_migrated=NULL WHERE is_migrated=false;
```

- to rollback the migration delete everything in the `authserver` schema on **iPIA** and use the following sql on **qPIA**:

```sql
DELETE FROM db_migrations WHERE NAME ='/migrations/1639043781__pia-392_add_accounts_migrated.sql';
ALTER TABLE accounts DROP column IF EXISTS is_migrated;
```

- ansible variable `pia_expose_postgres_ports` must be `false` on **qPIA** and **iPIA** hosts for release and production systems
- ansible variable `pia_is_direct_access_grant_enabled` has been added and should be set to `false` on PIA-Prod
- the `pia_ip_check_enabled` and `pia_cert_check_enabled` ansible variables are not used anymore and should be removed
- the NatCoEdc integration has been removed
  - PIA is not allowed to be included as an iFrame in NatCoEdc anymore
  - Therefore the following URLs should be removed from the variables `pia_x_frame_options` and `pia_content_security_policy`:
    - https://edc.hgw.nationale-kohorte.de/
    - https://edc-hd.nationale-kohorte.de/
  - Also, `pia_api_key` must be removed from any configuration

## 1.29.7

- this release adds the possibility to set the MODYS configuration within the IPIA host vars
  - the following vars can AND should now be set within the IPIA host vars if MODYS is used
    - PIA_MODYS_BASE_URL
    - PIA_MODYS_USERNAME
    - PIA_MODYS_PASSWORD
    - PIA_MODYS_STUDY
    - PIA_MODYS_IDENTIFIER_TYPE_ID
    - PIA_MODYS_REQUEST_CONCURRENCY

## 1.29

- the `pia_sormas_on_pia_password` variable is expected to be secure and not guessable. Please make sure that it has a length of 32 random characters.
- new SORMAS integration:
  - The complete flow between SORMAS and PIA was refactored in order to comply to an existing standard API
  - The following properties need to be configured in SORMAS to work properly with PIA:
    - interface.patientdiary.probandsurl = <WEBAPP_URL>/api/v1/sormas/symptomdiary
  - The following variables for the integration need to be set in PIA
    - SORMAS_SERVER_URL (OLD: SORMAS_SERVER)
    - SORMAS_ON_PIA_USER (OLD)
    - SORMAS_ON_PIA_PASSWORD (OLD)
    - PIA_ON_SORMAS_USER (OLD)
    - PIA_ON_SORMAS_PASSWORD (OLD)
    - SORMAS_STUDY (NEW)
      - the name of the study which is used on that stage
      - can be found via databaseservice with the following DB query, which should show only one result: `SELECT name FROM studies;`
      - if multiple results are returned, this has to be resolved together with the HZI
    - SORMAS_ON_PIA_TOKEN_VALIDITY_TIMEOUT (NEW)
      - should be synchronized with SORMAS symptomdiary token caching duration
      - in this release it must be set to the value: 22000
      - it is subject to change in later releases
      - DEFAULT: 10 (secounds)
    - DEFAULT_LANGUAGE (NEW)
      - the default language for the whole application.
      - DEFAULT: de-DE
      - OTHER OPTIONS: en-US, de-CH, fr-CH, it-CH
- the users status and account status will be migrated. Usually there should not be any problem on migration but to make it sure before doing the update, please check if there is any unexpected state in those columns:

```sql
-- there should only exist expected states as the account_status. If this query returns a row please fix that entry.
SELECT username, account_status
FROM users
WHERE account_status NOT IN ('no_account', 'active', 'deactivation_pending', 'deactivated');

-- there should only exist expected states as the study_status. If this query returns a row please fix that entry.
SELECT username, study_status
FROM users
WHERE study_status NOT IN ('active', 'deletion_pending', 'deleted', 'deactivated');
```

- the study a proband is assigned to will now be exactly one by database design. Therefore, make sure each proband has exactly one study:

```sql
SELECT u.username, json_agg(su.study_id) as studies
FROM users AS u
         LEFT OUTER JOIN study_users su ON u.username = su.user_id
WHERE u.role = 'Proband'
GROUP BY username
HAVING COUNT(su.study_id) <> 1;
```

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
