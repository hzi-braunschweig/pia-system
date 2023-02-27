#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

# make postgres port configurable for int/e2e tests
# this is required for running tests in k8s
if [ -n "$EWPIA_INTERNAL_PORT" ]; then
    echo using port $EWPIA_INTERNAL_PORT
    export PGPORT=$EWPIA_INTERNAL_PORT
fi

/usr/libexec/jobberrunner -u /usr/local/var/jobber/0/cmd.sock /root/.jobber&
exec /docker-entrypoint.sh postgres
