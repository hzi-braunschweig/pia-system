#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

while [[ $# -gt 0 ]]; do
  case $1 in
    --email)
      NEW_USER_EMAIL="$2"
      shift
      shift
      ;;
    --password)
      NEW_USER_PASSWORD="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown argument $1"
      exit 1
      ;;
  esac
done

if [ -z "$NEW_USER_EMAIL" ] || [ -z "$NEW_USER_PASSWORD" ]; then
    echo "usage --email EMAIL --password PASSWORD"
    exit 1
fi

export NEW_USER_EMAIL NEW_USER_PASSWORD

java -jar /keycloak-config-cli.jar \
    --import.path=/templates/user.json \
    --import.var-substitution=true \
    --import.var-substitution-prefix=[[ \
    --import.var-substitution-suffix=]] \
    --keycloak.availability-check.enabled=true \
    --keycloak.url=https://localhost:4000/ \
    --keycloak.user=${KEYCLOAK_ADMIN} \
    --keycloak.password=${KEYCLOAK_ADMIN_PASSWORD} \
    --keycloak.ssl-verify=false
