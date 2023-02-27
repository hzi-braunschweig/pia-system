#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

echo "group \"default\" {"

echo -n "  targets = [ "

for JOB in $JOBS_INSTALL; do
    export JOB_NAME=`echo $JOB | sed 's/\./_/g'`
    echo -n "\"$JOB_NAME\", "
done

echo "]"
echo "}"
echo ""

for JOB in $JOBS_INSTALL; do
    export JOB_NAME=`echo $JOB | sed 's/\./_/g'`
    echo "target \"$JOB_NAME\" {"
    echo "  context = \".\""
    echo "  dockerfile = \"$JOB/Dockerfile\""
    echo "  target = \"npm-install\""
    echo "  tags = [ \"$CI_REGISTRY/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$JOB-npm-install:$IMAGE_ID\" ]"
    echo "  args = {"
    echo "    DIR = \"$JOB\""
    echo "  }"
    echo "}"
    echo ""
done
