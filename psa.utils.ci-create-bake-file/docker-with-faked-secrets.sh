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
    echo -n "\"$JOB_NAME-with-faked-secrets\", "
done

echo "]"
echo "}"
echo ""

for JOB in $JOBS_DOCKER; do
    export JOB_NAME=`echo $JOB | sed 's/\./_/g'`
    echo "target \"$JOB_NAME-with-faked-secrets\" {"
    echo "  context = \".\""
    echo "  dockerfile = \"psa.utils.scripts/secrets-dockerfile/Dockerfile\""
    echo "  tags = [ \"$CI_REGISTRY/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$JOB:$IMAGE_ID-with-faked-secrets\" ]"
    echo "  args = {"
    echo "    BASE = \"$CI_REGISTRY/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$JOB:$IMAGE_ID\""
    echo "  }"
    echo "}"
    echo ""
done
