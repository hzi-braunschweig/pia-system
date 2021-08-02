#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

envsubst < /etc/rabbitmq/definitions.json-template > /etc/rabbitmq/definitions.json

. /usr/local/bin/docker-entrypoint.sh
