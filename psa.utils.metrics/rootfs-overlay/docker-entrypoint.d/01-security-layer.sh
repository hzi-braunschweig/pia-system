#!/bin/sh

ME=$(basename $0)

if [ "$METRICS_EXTERNAL_PROTOCOL" != "https" ]; then
    echo "" > /etc/nginx/templates/security.template
    echo "$ME: info: External accesss via HTTP enabled"
else
    echo "$ME: info: External accesss via HTTPS enabled"
fi
