#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#


# the deletion of personal_data had not been correctly implemented for sormas integration until now.
# So we need to delete old data and the sormasservice will update them for each stil existing proband.
# After a successful migration to the new sormas integration this script can be deleted.
shopt -s nocasematch;
if [[ "${IS_SORMAS_ACTIVE:-false}" =~ "true" ]]; then
  echo "TRUNCATE personal_data;" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --no-password --dbname "$POSTGRES_DB"
fi
