#!/bin/bash

#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

set -e

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export COMPOSE_PROJECT_NAME=src

NODE_USER_ID=1000

if [[ $UID -ne $NODE_USER_ID ]] && [[ -d $PWD/generated/secrets ]]; then
    # we need to own the secrets folder because it is probably owned by the node user (in a previous call)
    docker run -it --rm -v $PWD/generated/:/data busybox chown -R $UID /data/secrets
fi

# create weak secrets that are required to run this locally
docker build --build-arg AUTH_KEY_SIZE=1024 --build-arg CA_KEY_SIZE=1024 --build-arg SERVICE_KEY_SIZE=1024 --build-arg CA_VALIDITY_DAYS=36500 --build-arg SERVICE_VALIDITY_DAYS=36500 -o generated/secrets/ ../../psa.utils.scripts/generate-secrets/

if [[ $UID -ne $NODE_USER_ID ]] && [[ -d $PWD/generated/secrets ]]; then
    # own the secrets as the node user
    # only if it differs from our id
    docker run -it --rm -v $PWD/generated/:/data busybox chown -R $NODE_USER_ID /data/secrets
fi

# create docker-compose stuff from templates
docker build -o generated -f template.dockerfile ..

export ARGS="--env-file ./generated/.env --file ./generated/docker-compose.yml"

if [[ -n "$1" ]]; then
	command=$1;
    arg=$2;
fi

if [[ (${command} == 'build') && (${arg}) ]]; then
    docker-compose $ARGS build ${arg};

elif [[ ${command} == 'build' ]]; then
    docker-compose $ARGS build;

elif [[ ${command} == 'pull' ]]; then
    docker-compose $ARGS --verbose pull;

elif [[ (${command} == 'start') && (${arg}) ]]; then
    docker-compose $ARGS stop ${arg}
    docker-compose $ARGS up -d --build --no-deps ${arg}

elif [[ ${command} == 'start' ]]; then
    docker-compose $ARGS up -d --build;

elif [[ ${command} == 'stop' ]]; then
    docker-compose $ARGS stop;

elif [[ (${command} == 'logs') && (${arg}) ]]; then
    docker logs -f -t ${arg}

elif [[ (${command} == 'logs') ]]; then
    docker-compose $ARGS logs -f -t --tail="all";

elif [[ (${command} == 'remove') && (${arg}) ]]; then
    docker-compose $ARGS stop ${arg}
    docker-compose $ARGS rm -v -f ${arg}

elif [[ ${command} == 'remove' ]]; then
    docker-compose $ARGS stop;
    docker-compose $ARGS rm -v -f;

elif [[ ${command} == 'update' ]]; then
    docker-compose $ARGS stop;
    docker-compose $ARGS build;
    docker-compose $ARGS up -d;
    docker-compose $ARGS logs -f -t --tail="all";

elif [[ ${command} == 'refresh' ]]; then
    true

elif [[ ${command} == 'help' ]]; then
    echo "usage: ";
    echo "build - build all images"
    echo "build service - build only one service image (databaseservice, ipiaservice, ewpiaservice, questionnaireservice, userservice, analyzerservice, sormasservice, notificationservice, webappserver)"
    echo "start - start the containers"
    echo "start service - start only one service (databaseservice, ipiaservice, ewpiaservice, questionnaireservice, userservice, analyzerservice, sormasservice, notificationservice, webappserver)"
    echo "stop - stop the containers"
    echo "remove - remove volumes and stop containers"
    echo "logs - attach to logs of all containers"
    echo "logs service - attach to logs of service container (databaseservice, ipiaservice, ewpiaservice, questionnaireservice, userservice, analyzerservice, sormasservice, notificationservice, webappserver)"
    echo "update - stop, build and start containers"
    echo "refresh - updates the docker-compose from the templates"
else
    docker-compose $ARGS stop;
    docker-compose $ARGS build;
    docker-compose $ARGS up -d;
    docker-compose $ARGS logs -f -t --tail="all";
fi
