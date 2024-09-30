#!/bin/sh

#
# SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

OUTPUT_DIR=${OUTPUT:-./docs/openapi.yaml}
SPEC_DIR="spec"
SPEC_FILE_NAME="openapi.yaml"
PATH_MODIFICATIONS="\"pathModification\": {\"stripStart\": \"/public\"}"
INPUT_FILE_TEMPLATE="{\"inputFile\": \"./%s/%s/%s\", ${PATH_MODIFICATIONS}}"
INPUT_FILES=

handle_directory() {
  local dir=$1
  echo $dir
  cd $dir
  if [ -z "$(ls -A $SPEC_DIR/*.yaml)" ] || [ ! -z "$REBUILD_OPENAPI" ]
  then
    npm i --prefer-offline --no-audit --progress=false
    npm run build.openapi
  fi
  if [ -d "$SPEC_DIR" ]
  then
    handle_spec_file $dir
  fi
}

handle_spec_file() {
  local dir=$1
  cd $SPEC_DIR
  for file in $(ls)
  do
    if [ "$file" = "$SPEC_FILE_NAME" ]
    then
      local input_file
      input_file=$(printf "$INPUT_FILE_TEMPLATE" "$dir" "$SPEC_DIR" "$file")
      INPUT_FILES="$INPUT_FILES$input_file,"
    fi
  done
  cd ../..
}

found_directories=$(find . -maxdepth 2 -type f -name "package.json" -exec grep -l '"build.openapi":' {} \+ | xargs -n 1 dirname | xargs -n 1 basename | sort)
for dir in $found_directories
do
  handle_directory $dir
done
INPUT_FILES_JSON="$(echo $INPUT_FILES | sed 's/,$//')"
cat > openapi-merge.json <<EOF
{
  "inputs": [
    {"inputFile": "./psa.server.apigateway/spec/openapi.public.yaml"},
    ${INPUT_FILES_JSON}
  ],
  "output": "$OUTPUT_DIR"
}
EOF