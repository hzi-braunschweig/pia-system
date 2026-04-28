#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

# add inverted variable so that it can be used in realms json
if [ `echo "$IS_DEVELOPMENT_SYSTEM" | tr '[:upper:]' '[:lower:]'` == "true" ]; then
    export IS_NOT_DEVELOPMENT_SYSTEM=false
    export IS_DEVELOPMENT_SYSTEM=true
else
    export IS_NOT_DEVELOPMENT_SYSTEM=true
    export IS_DEVELOPMENT_SYSTEM=false
fi

KEYCLOAK_START_PID=$1

echo waiting for keycloak to be ready $KEYCLOAK_START_PID

ITERATION=0
MAX_ITERATIONS=120
while ! ({ printf 'HEAD /health/ready HTTP/1.0\r\n\r\n' >&0; grep 'HTTP/1.0 200'; } 0<>/dev/tcp/localhost/9000); do
    ITERATION=$((ITERATION+1))

    if [ $ITERATION -gt $MAX_ITERATIONS ]; then
        echo timeout waiting for keycloak
        exit 1
    fi

    if ! kill -0 $KEYCLOAK_START_PID; then
        echo keycloak already terminated
        exit 1
    fi

    echo waiting for keycloak $ITERATION of $MAX_ITERATIONS
    sleep 1
done

echo keycloak is ready

# use only lowercase chars for keycloak users
export KEYCLOAK_TEMP_ADMIN=temp-admin-`tr -dc 'a-z' < /dev/urandom | head -c 8`
# create a random password for the temp admin
export KEYCLOAK_TEMP_ADMIN_PASSWORD=`tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 64`

echo creating temp admin

# create the temp admin
kc.sh \
    -Djava.security.egd=file:/dev/urandom \
    bootstrap-admin user \
    --db=postgres \
    --db-username=${DB_AUTHSERVER_USER} \
    --db-password=${DB_AUTHSERVER_PASSWORD} \
    --db-url-port=${DB_AUTHSERVER_PORT} \
    --db-url-host=${DB_AUTHSERVER_HOST} \
    --db-url-database=${DB_AUTHSERVER_DB} \
    --username:env KEYCLOAK_TEMP_ADMIN \
    --password:env KEYCLOAK_TEMP_ADMIN_PASSWORD

echo logging in as the temp admin

# login as the temp admin
kcadm.sh config credentials --server http://localhost:4000/ --realm master --user $KEYCLOAK_TEMP_ADMIN --password $KEYCLOAK_TEMP_ADMIN_PASSWORD

echo login successful

# remote all users from master realm (but not temp admin itself)
for USER_ID in `kcadm.sh get users -r master --offset 0 --limit 100 | jq ".[] | select(.username != \"$KEYCLOAK_TEMP_ADMIN\") | .id" --raw-output`; do
    echo deleting user with id $USER_ID
    kcadm.sh delete users/$USER_ID -r master
done

# create the new keycload admin
kc.sh \
    -Djava.security.egd=file:/dev/urandom \
    bootstrap-admin user \
    --db=postgres \
    --db-username=${DB_AUTHSERVER_USER} \
    --db-password=${DB_AUTHSERVER_PASSWORD} \
    --db-url-port=${DB_AUTHSERVER_PORT} \
    --db-url-host=${DB_AUTHSERVER_HOST} \
    --db-url-database=${DB_AUTHSERVER_DB} \
    --username:env KEYCLOAK_ADMIN \
    --password:env KEYCLOAK_ADMIN_PASSWORD

# login as the admin
kcadm.sh config credentials --server http://localhost:4000/ --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD

# remove all other users (especially the temp user)
for USER_ID in `kcadm.sh get users -r master --offset 0 --limit 100 | jq ".[] | select(.username != \"$KEYCLOAK_ADMIN\") | .id" --raw-output`; do
    echo deleting user with id $USER_ID
    kcadm.sh delete users/$USER_ID -r master
done

java -jar /keycloak-config-cli.jar \
    --import.files.locations=/import/* \
    --import.var-substitution.enabled=true \
    --import.var-substitution.prefix=[[ \
    --import.var-substitution.suffix=]] \
    --keycloak.availability-check.enabled=true \
    --keycloak.url=http://localhost:4000/ \
    --keycloak.user=${KEYCLOAK_ADMIN} \
    --keycloak.password=${KEYCLOAK_ADMIN_PASSWORD}

# if specified by the env, we will add an initial sysadmin
# in particular this is used by the e2e tests
if [ ! -z "$SYSADMIN_EMAIL" ] && [ ! -z "$SYSADMIN_PASSWORD" ]; then
    echo "adding initial sysadmin"
    /add-sysadmin.sh --email "$SYSADMIN_EMAIL" --password "$SYSADMIN_PASSWORD"
fi
