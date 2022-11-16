#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

if [ `echo "$IS_DEVELOPMENT_SYSTEM" | tr '[:upper:]' '[:lower:]'` == "true" ]; then
    export IS_NOT_DEVELOPMENT_SYSTEM=false
    export IS_DEVELOPMENT_SYSTEM=true
else
    export IS_NOT_DEVELOPMENT_SYSTEM=true
    export IS_DEVELOPMENT_SYSTEM=false
fi

java -jar /keycloak-config-cli.jar \
    --import.files.locations=/import/* \
    --import.var-substitution.enabled=true \
    --import.var-substitution.prefix=[[ \
    --import.var-substitution.suffix=]] \
    --keycloak.availability-check.enabled=true \
    --keycloak.url=https://localhost:4000/ \
    --keycloak.user=${KEYCLOAK_ADMIN} \
    --keycloak.password=${KEYCLOAK_ADMIN_PASSWORD} \
    --keycloak.ssl-verify=false

# if specified by the env, we will add an initial sysadmin
# in particular this is used by the e2e tests
if [ ! -z "$SYSADMIN_EMAIL" ] && [ ! -z "$SYSADMIN_PASSWORD" ]; then
    echo "adding initial sysadmin"
    /add-sysadmin.sh --email "$SYSADMIN_EMAIL" --password "$SYSADMIN_PASSWORD"
fi
