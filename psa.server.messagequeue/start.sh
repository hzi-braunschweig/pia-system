#!/bin/bash

envsubst < /etc/rabbitmq/definitions.json-template > /etc/rabbitmq/definitions.json

. /usr/local/bin/docker-entrypoint.sh
