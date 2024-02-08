#!/bin/bash

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

# pwgen must be installed on your machine
generate_prefix() {
    while true; do
        local pass=$(pwgen -A -B -0 4 1)

        if ! [[ " ${exclude_list[@]} " =~ " ${pass} " ]]; then
            exclude_list+=("$pass")
            echo $pass
            return
        fi
    done
}

passwords=()
exclude_list=()

for i in {1..10}; do
    passwords+=("$(generate_prefix)")
done

echo "Generated Prefixes:"
printf '%s\n' "${passwords[@]}"
