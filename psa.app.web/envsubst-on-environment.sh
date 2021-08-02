#!/bin/sh
#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

# substitutes the placeholder with the environment variables during runtime in the compiled main.js
# then updates the main.js.gz
mainFileName="$(ls /usr/share/nginx/html/main*.js)"
envsubst "\$IS_DEVELOPMENT_SYSTEM \$DEFAULT_LANGUAGE \$MATOMO_URL \$IS_SORMAS_ENABLED" < /usr/share/nginx/template/main.js.template > "${mainFileName}"
gzip -f -k "${mainFileName}"
