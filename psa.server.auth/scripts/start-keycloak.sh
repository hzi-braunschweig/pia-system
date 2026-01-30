#!/bin/bash

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

KEYCLOAK_PATH=/api/v1/auth

STRICT_HTTPS=true
if [ "${EXTERNAL_PROTOCOL}" == "http" ]; then
    STRICT_HTTPS=false
fi

kc.sh \
    -Djava.security.egd=file:/dev/urandom \
    start \
    --hostname="${EXTERNAL_PROTOCOL}://${EXTERNAL_HOST}${KEYCLOAK_PATH}" \
    --hostname-admin="${EXTERNAL_PROTOCOL}://${EXTERNAL_HOST}${KEYCLOAK_PATH}" \
    --hostname-backchannel-dynamic=false \
    --http-port=4000 \
    --http-enabled=true \
    --proxy-headers=xforwarded \
    --db=postgres \
    --db-username=${DB_AUTHSERVER_USER} \
    --db-password=${DB_AUTHSERVER_PASSWORD} \
    --db-url-port=${DB_AUTHSERVER_PORT} \
    --db-url-host=${DB_AUTHSERVER_HOST} \
    --db-url-database=${DB_AUTHSERVER_DB} \
