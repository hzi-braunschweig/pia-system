#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

DEST_FOLDER=$CI_COMMIT_REF_SLUG
PREFIX=$CI_PIPELINE_ID-$CI_JOB_ID

UPLOAD_DIR=./psa.app.web/cypress/videos/

if ! [[ $CI_COMMIT_REF_SLUG =~ ^release ]]; then
	echo skip upload for $CI_COMMIT_REF_SLUG
	exit
fi

 # may fail if the folder already exists, but we don't care
 curl "$WEBDAV_UPLOAD_URL/$DEST_FOLDER" \
	-X "MKCOL" \
	-H "Authorization: Basic $WEBDAV_UPLOAD_AUTH" \
	--compressed

find $UPLOAD_DIR -type f -name "*" -print0 | while IFS= read -r -d '' file; do
	
	TARGET_NAME=`echo $file | sed "s|$UPLOAD_DIR||g" | sed "s|[/ ]|-|g"`

	curl "$WEBDAV_UPLOAD_URL/$DEST_FOLDER/$PREFIX-$TARGET_NAME" \
		-T "$file" \
		-X "PUT" \
		-H "Authorization: Basic $WEBDAV_UPLOAD_AUTH" \
		--compressed
done
