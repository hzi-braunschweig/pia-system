#!/bin/sh

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

ME=$(basename $0)
TEMPLATES=/etc/nginx/templates

case $METRICS_ENABLED_FOR in
    qpia)
        mv $TEMPLATES/metrics-qpia.template $TEMPLATES/metrics.template
        echo "$ME: info: enabled qpia configuration"
        ;;
    ipia)
        mv $TEMPLATES/metrics-ipia.template $TEMPLATES/metrics.template
        echo "$ME: info: enabled ipia configuration"
        ;;
    ewpia)
        mv $TEMPLATES/metrics-ewpia.template $TEMPLATES/metrics.template
        echo "$ME: info: enabled ewpia configuration"
        ;;
    *)
        cat $TEMPLATES/metrics-qpia.template > $TEMPLATES/metrics.template
        cat $TEMPLATES/metrics-ipia.template >> $TEMPLATES/metrics.template
        cat $TEMPLATES/metrics-ewpia.template >> $TEMPLATES/metrics.template
        echo "$ME: info: enabled configuration for all"
        ;;
esac
