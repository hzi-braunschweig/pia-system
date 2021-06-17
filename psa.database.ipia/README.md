# psa.database.ipia

personal proband data from MODYS

Connect to DB in local container
`export PGPASSWORD=superpassword && psql -h localhost -p 2345 -d ipia_database -U superuser`

Create database dump iPIA:

- connect to vpn with token, then:
  `ssh -A -t conventic@192.168.109.2 ssh 192.168.105.5 ./PIA/psa.docker/src/grapDumpIpia.sh > ./PIA_backups/$(date -I)_IPIA_backup.sql`

## Postgres Image Updates

see [psa.database](../psa.database)

## Creating migrations

- create migration file in migrations folder with timestamp and description in filename, e.g.:
  `touch migrations/$(date +"%s")__alt_questionnaires_publish.sql`
- insert sql commands
- make sure they are repeatable (do not fail on second execution and do not create duplicate data), eg:
  `CREATE TABLE IF NOT EXISTS`
  `INSERT INTO ... ON CONFLICT DO NOTHING`
  `DO $$ BEGIN IF NOT EXISTS(SELECT ...) THEN ALTER TABLE ... RENAME COLUMN ... END IF; END $$;`

## Migrating db

- if psql is running from this docker image the migration is done automatically
