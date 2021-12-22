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

# create user for loggingservice schema
COMMANDS+="SELECT 'CREATE USER $DB_LOG_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_LOG_USER') \gexec\n"
COMMANDS+="ALTER USER $DB_LOG_USER WITH ENCRYPTED PASSWORD '$DB_LOG_PASSWORD';\n"
COMMANDS+="GRANT loggingservice_role to $DB_LOG_USER;\n"
COMMANDS+="ALTER ROLE $DB_LOG_USER SET search_path TO loggingservice;\n"


# create user for sormasservice schema
COMMANDS+="SELECT 'CREATE USER $DB_SORMAS_USER' WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_SORMAS_USER') \gexec\n"
COMMANDS+="ALTER USER $DB_SORMAS_USER WITH ENCRYPTED PASSWORD '$DB_SORMAS_PASSWORD';\n"
COMMANDS+="GRANT sormasservice_role to $DB_SORMAS_USER;\n"
COMMANDS+="ALTER ROLE $DB_SORMAS_USER SET search_path TO sormasservice;\n"


# update the search_path for the superuser
# "public" should be the primary search path!
COMMANDS+="ALTER ROLE $POSTGRES_USER SET search_path TO public;\n"

COMMANDS+="COMMIT;\n"


# search paths:
# the new schemas are owend by the superuser therefore the search path `SHOW search_path`
# gets extended with the new schema and old migrations have access to the tables in that search_path.
# the newly created role has the same name as the schema and is therefore the primary search_path.

printf "$COMMANDS" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --dbname "$POSTGRES_DB"
