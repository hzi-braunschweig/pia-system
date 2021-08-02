#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

/usr/libexec/jobberrunner -u /usr/local/var/jobber/0/cmd.sock /root/.jobber&
exec /docker-entrypoint.sh postgres
