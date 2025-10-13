#!/bin/sh
#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

# substitutes the placeholder with the environment variables during runtime in compiled *.js-files
substitute_env_in_js_files() {
  local TEMPLATE_DIR="$1"
  local TARGET_DIR="$2"

  for FILE in "$TEMPLATE_DIR"/*.js; do
    [ -e "$FILE" ] || continue
    TARGET_PATH="$TARGET_DIR/$(basename "$FILE")"
    envsubst "\$IS_DEVELOPMENT_SYSTEM \$IS_E2E_TEST_SYSTEM \$DEFAULT_LANGUAGE \$IS_SORMAS_ENABLED" < "$FILE" > "$TARGET_PATH"
    gzip -f -k "$TARGET_PATH"
  done
}

# substitute env variables in proband app
substitute_env_in_js_files "/usr/share/nginx/template" "/usr/share/nginx/html"

# substitute env variables in admin app
substitute_env_in_js_files "/usr/share/nginx/template/admin" "/usr/share/nginx/html/admin"