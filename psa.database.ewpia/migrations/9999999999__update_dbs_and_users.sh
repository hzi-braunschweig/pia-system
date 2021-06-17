#!/bin/bash

set -e

COMMANDS="BEGIN;\n"

# update the superuser password
COMMANDS+="ALTER ROLE $POSTGRES_USER WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';\n"

COMMANDS+="COMMIT;\n"

printf "$COMMANDS" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --dbname "$POSTGRES_DB"
