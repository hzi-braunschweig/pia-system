ARG BASE=

FROM $BASE

ARG SRC_PATH=./secrets/

# this is just for testing - so we add ALL the secrets everywhere they could be needed!
# not for production!

# microservices
COPY --chown=1000:1000 $SRC_PATH /usr/src/node-app/

# postgres
COPY --chown=999:999 $SRC_PATH /tmp_config/

# webappserver
COPY $SRC_PATH /etc/
