#!/bin/bash

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
# 

# run this script from within the authserver pod

kcadm.sh config credentials --server http://localhost:4000 --realm master --user admin --password $KEYCLOAK_ADMIN_PASSWORD

TOTAL_NUMBER_OF_USERS=$(kcadm.sh get users/count -r pia-proband-realm)
echo "Total number of users: $TOTAL_NUMBER_OF_USERS"

BATCH_SIZE=100
OFFSET=0

echo "Adding action terms_and_condition to all users in pia-proband-realm. This will take a while (approximately $((TOTAL_NUMBER_OF_USERS/2)) seconds)."

while [ $OFFSET -lt $TOTAL_NUMBER_OF_USERS ]; do
  # the image does not have a package manager installed so we cannot install other packages like jq 
  USER_IDS=$(kcadm.sh get users -r pia-proband-realm --fields id --limit $BATCH_SIZE --offset $OFFSET | grep '"id"' | sed 's/.*"id" : "\([^"]*\)".*/\1/')

  USER_COUNT=$(echo "$USER_IDS" | wc -w)
  echo "Progress: $OFFSET / $TOTAL_NUMBER_OF_USERS"

  for id in $USER_IDS; do
    if ! kcadm.sh update users/$id -r pia-proband-realm -s 'requiredActions=["TERMS_AND_CONDITIONS"]'; then
      echo failed to update $id
    fi
  done

  OFFSET=$((OFFSET + BATCH_SIZE))

  if [ $USER_COUNT -eq 0 ]; then
    echo "No more users to process."
    break
  fi

  echo "Offset $OFFSET: $USER_COUNT users processed"
done

echo "All users have been processed."