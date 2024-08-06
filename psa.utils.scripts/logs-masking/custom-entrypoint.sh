#!/bin/bash

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
# 

MASKING_REGEX='s/([0-9]{1,3}(\.[0-9]{1,3}){3})/xxx.xxx.xxx.xxxx/g; s/(\w{4}:){3,7}\w{4}/xxxx:xxxx:xxxx:xxxx/g; s/([A-Za-z0-9\._%+-]+@[A-Za-z0-9\.-]+\.[A-Za-z]{2,})/xxxxx@xxxxx.xxx/g'

PATH_TO_ENTRYPOINT_SCRIPT="$1"
shift 

exec "$PATH_TO_ENTRYPOINT_SCRIPT" "$@" 2> >(sed -u -E "$MASKING_REGEX" >&2) | sed -u -E "$MASKING_REGEX"

