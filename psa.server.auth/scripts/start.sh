#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e
set -m

# start keycloak in the background
./start-keycloak.sh &

# wait for the configuration import to succeed (requires running keycloak)
./import.sh

# get keycloak to the foreground
fg %1
