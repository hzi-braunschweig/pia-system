#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

echo "group \"default\" {"

echo -n "  targets = [ "

for JOB in $JOBS_DOCKER; do
    export JOB_NAME=`echo $JOB | sed 's/\./_/g'`
    echo -n "\"$JOB_NAME\", "
done

echo "]"
echo "}"
echo ""

for JOB in $JOBS_DOCKER; do
    export JOB_NAME=`echo $JOB | sed 's/\./_/g'`
    echo "target \"$JOB_NAME\" {"
    echo "  context = \".\""
    echo "  dockerfile = \"$JOB/Dockerfile\""
    echo "  tags = [ \"$CI_REGISTRY/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$JOB:$IMAGE_ID\" ]"
    echo "  args = {"
    echo "    DIR = \"$JOB\""
    echo "    VERSION_INFO_PIPELINE_ID = \"$IMAGE_ID\""
    echo "    VERSION_INFO_GIT_HASH = \"$CI_COMMIT_SHA\""
    echo "    VERSION_INFO_GIT_REF = \"$CI_COMMIT_REF_SLUG\""
    echo "  }"
    echo "}"
    echo ""
done
