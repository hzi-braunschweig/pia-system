# psa.database

### Connect to DB in local container

`export PGPASSWORD=superpassword && psql -h localhost -p 5432 -d pia_database -U superuser`

## Creating migrations

- create migration file in migrations folder with timestamp and description in filename, e.g.:
  `touch migrations/$(date +"%s")__alt_questionnaires_publish.sql`
- insert sql commands
- make sure they are repeatable (do not fail on second execution and do not create duplicate data), eg:
  `CREATE TABLE IF NOT EXISTS`
  `INSERT INTO ... ON CONFLICT DO NOTHING`
  `DO $$ BEGIN IF NOT EXISTS(SELECT ...) THEN ALTER TABLE ... RENAME COLUMN ... END IF; END $$;`

### Migrating a service to its own DB schema

The long term goal is that every microservice owns its own database schema. In qPIA this is already the case for
loggingservice and sormasservice. In order to migrate more services to its own schemas, the following script should be
used as a template for creating the corresponding database role. Create a new migration script, add the following lines
and replace `<servicename>` by the name of the specific microservice for which the role should be created.

```postgresql
BEGIN;

DROP ROLE IF EXISTS <servicename>_role;
CREATE ROLE <servicename>_role;
GRANT USAGE, CREATE ON SCHEMA <servicename> TO <servicename>_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA <servicename> TO <servicename>_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA <servicename> GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO <servicename>_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA <servicename> TO <servicename>_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA <servicename> GRANT USAGE, SELECT ON SEQUENCES TO <servicename>_role;
REASSIGN OWNED BY <servicename> TO <servicename>_role;
DROP OWNED BY <servicename>;
DROP USER IF EXISTS <servicename>;

COMMIT;
```

Additionally the corresponding user needs to be created within the `9999999999__update_dbs_and_users.sh` file, where <servicename> = <domainname>service:

```bash
# create user for <servicename> schema
COMMANDS+="SELECT 'CREATE USER $DB_<domainname>_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_<domainname>_USER') \gexec\n"
COMMANDS+="ALTER USER $DB_<domainname>_USER WITH ENCRYPTED PASSWORD '$DB_<domainname>_PASSWORD';\n"
COMMANDS+="GRANT <servicename>_role to $DB_<domainname>_USER;\n"
COMMANDS+="ALTER ROLE $DB_<domainname>_USER SET search_path TO <servicename>;\n"
```

## Postgres Image Updates

If we get `md5sum: WARNING: 1 of 1 computed checksums did NOT match` after an image upgrade this is because the docker-entrypoint that we are patching, has changed.
Therefore, the migration.patch has to be updated.

```bash
# extract the entrypoint from the postgres image that should be used
docker run -v $PWD:/data -it --rm postgres:<version> cp docker-entrypoint.sh /data

# create a copy for later comparison
cp docker-entrypoint.sh docker-entrypoint.sh.original

# create the mmd5sum of that file
md5sum docker-entrypoint.sh
# update the md5sum in the Dockerfile

# try to apply the old patch
patch docker-entrypoint.sh migration.patch
# AND CHECK THE RESULT! Manually patch the entrypoint if necessary!

# create the updated patch
diff -u docker-entrypoint.sh.original docker-entrypoint.sh | sed 's/docker-entrypoint.sh.original/docker-entrypoint.sh/g' > migration.patch
```

## Cron-Jobs (implemented using Jobber)

- Every sunday on 23:45 we are running a vacuumdb --full.
