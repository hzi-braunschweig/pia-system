#!/bin/sh
#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

# substitutes the placeholder with the environment variables during runtime in the compiled main.js
# then updates the main.js.gz
mainFileNameProbandApp="$(ls /usr/share/nginx/html/main*.js)"
mainFileNameAdminApp="$(ls /usr/share/nginx/html/admin/main*.js)"
envsubst "\$IS_DEVELOPMENT_SYSTEM \$DEFAULT_LANGUAGE \$IS_SORMAS_ENABLED" < /usr/share/nginx/template/main.js.template > "${mainFileNameProbandApp}"
envsubst "\$IS_DEVELOPMENT_SYSTEM \$DEFAULT_LANGUAGE \$IS_SORMAS_ENABLED" < /usr/share/nginx/template/admin/main.js.template > "${mainFileNameAdminApp}"
gzip -f -k "${mainFileNameProbandApp}" "${mainFileNameAdminApp}"
