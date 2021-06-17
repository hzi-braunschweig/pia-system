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

## Postgres Image Updates

If we get `md5sum: WARNING: 1 of 1 computed checksums did NOT match` after an image upgrade this is because the docker-entrypoint that we are patching, has changed.
Therefore, the migration.patch has to be updated.

```bash
# extract the entrypoint from the postgres image that should be used
docker run -v $PWD:/data -it --rm postgres:10.16 cp docker-entrypoint.sh /data

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
