#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

COMMANDS="BEGIN;\n"

# update the superuser password
COMMANDS+="ALTER ROLE $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\n"

# create user for personaldataservice schema
COMMANDS+="SELECT 'CREATE USER $DB_PERSONALDATA_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_PERSONALDATA_USER') \gexec\n"
COMMANDS+="ALTER USER $DB_PERSONALDATA_USER WITH ENCRYPTED PASSWORD '$DB_PERSONALDATA_PASSWORD';\n"
COMMANDS+="GRANT personaldataservice_role to $DB_PERSONALDATA_USER;\n"
COMMANDS+="ALTER ROLE $DB_PERSONALDATA_USER SET search_path TO personaldataservice;\n"


# create user for authserver schema
COMMANDS+="SELECT 'CREATE USER $DB_AUTHSERVER_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_AUTHSERVER_USER') \gexec\n"
COMMANDS+="ALTER USER $DB_AUTHSERVER_USER WITH ENCRYPTED PASSWORD '$DB_AUTHSERVER_PASSWORD';\n"
COMMANDS+="GRANT authserver_role to $DB_AUTHSERVER_USER;\n"
COMMANDS+="ALTER ROLE $DB_AUTHSERVER_USER SET search_path TO authserver;\n"

# remove current auth admin to allow new admin with updated credentials to be created
COMMANDS+="DO \$\$\n"
COMMANDS+="BEGIN\n"
COMMANDS+="  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'authserver') THEN\n"
COMMANDS+="    DELETE FROM authserver.credential WHERE user_id IN (SELECT id FROM authserver.user_entity ue WHERE username = 'admin' AND realm_id = 'master');\n"
COMMANDS+="    DELETE FROM authserver.user_role_mapping WHERE user_id IN (SELECT id FROM authserver.user_entity ue WHERE username = 'admin' AND realm_id = 'master');\n"
COMMANDS+="    DELETE FROM authserver.user_entity WHERE username = 'admin' AND realm_id = 'master';\n"
COMMANDS+="  END IF;\n"
COMMANDS+="END;\n"
COMMANDS+="\$\$;\n"

# update the search_path for the superuser
# "public" should be the primary search path!
COMMANDS+="ALTER ROLE $POSTGRES_USER SET search_path TO public;\n"

COMMANDS+="COMMIT;\n"

# search paths:
# the new schemas are owend by the superuser therefore the search path `SHOW search_path`
# gets extended with the new schema and old migrations have access to the tables in that search_path.
# the newly created role has the same name as the schema and is therefore the primary search_path.

printf "$COMMANDS" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --dbname "$POSTGRES_DB"
