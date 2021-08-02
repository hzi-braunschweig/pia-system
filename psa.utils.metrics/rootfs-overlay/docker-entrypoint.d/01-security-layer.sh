#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

ME=$(basename $0)

if [ "$METRICS_EXTERNAL_PROTOCOL" != "https" ]; then
    echo "" > /etc/nginx/templates/security.template
    echo "$ME: info: External accesss via HTTP enabled"
else
    echo "$ME: info: External accesss via HTTPS enabled"
fi
