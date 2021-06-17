#!/bin/bash

set -e

DB_PERSONALDATA_SCHEMA=$DB_PERSONALDATA_USER

COMMANDS="BEGIN;\n"

# update the superuser password
COMMANDS+="ALTER ROLE $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\n"

# create schema
COMMANDS+="CREATE SCHEMA IF NOT EXISTS $DB_PERSONALDATA_SCHEMA;\n"

# move tables to schema
COMMANDS+="SELECT 'ALTER TABLE pending_deletions SET SCHEMA $DB_PERSONALDATA_SCHEMA' WHERE NOT EXISTS (SELECT * FROM information_schema.tables where table_schema = '$DB_PERSONALDATA_SCHEMA' and table_name = 'pending_deletions') \gexec\n"
COMMANDS+="SELECT 'ALTER TABLE personal_data SET SCHEMA $DB_PERSONALDATA_SCHEMA' WHERE NOT EXISTS (SELECT * FROM information_schema.tables where table_schema = '$DB_PERSONALDATA_SCHEMA' and table_name = 'personal_data') \gexec\n"

COMMANDS+="SELECT 'ALTER TABLE IF EXISTS deletion_logs SET SCHEMA $DB_PERSONALDATA_SCHEMA' WHERE NOT EXISTS (SELECT * FROM information_schema.tables where table_schema = '$DB_PERSONALDATA_SCHEMA' and table_name = 'deletion_logs') \gexec\n"


# create role for schema
COMMANDS+="SELECT 'CREATE ROLE $DB_PERSONALDATA_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_PERSONALDATA_USER') \gexec\n"

# allow login with password
COMMANDS+="ALTER ROLE $DB_PERSONALDATA_USER WITH ENCRYPTED PASSWORD '$DB_PERSONALDATA_PASSWORD';\n"
COMMANDS+="ALTER ROLE $DB_PERSONALDATA_USER WITH LOGIN;\n"

# allow usage of schema for new role
COMMANDS+="GRANT USAGE ON SCHEMA $DB_PERSONALDATA_SCHEMA TO $DB_PERSONALDATA_USER;\n"

# set superuser as owner for table
COMMANDS+="ALTER TABLE IF EXISTS personal_data OWNER TO $POSTGRES_USER;\n"
COMMANDS+="ALTER TABLE IF EXISTS pending_deletions OWNER TO $POSTGRES_USER;\n"

# allow access to all tables in schema
COMMANDS+="GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA $DB_PERSONALDATA_SCHEMA TO $DB_PERSONALDATA_USER;\n"

# allow to access the sequences in the schema
COMMANDS+="GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA $DB_PERSONALDATA_SCHEMA TO $DB_PERSONALDATA_USER;\n"

# update the search_path for the superuser
COMMANDS+="ALTER ROLE $POSTGRES_USER SET search_path TO $DB_PERSONALDATA_SCHEMA, public;\n"

COMMANDS+="COMMIT;\n"


# search paths:
# the new schemas are owend by the superuser therefore the search path `SHOW search_path`
# gets extended with the new schema and old migrations have access to the tables in that search_path.
# the newly created role has the same name as the schema and is therefore the primary search_path.

printf "$COMMANDS" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --dbname "$POSTGRES_DB"
