FROM mysql:5.5.62@sha256:12da85ab88aedfdf39455872fb044f607c32fdc233cd59f1d26769fbf439b045

ARG DIR=

COPY $DIR/modys.sql /docker-entrypoint-initdb.d/
COPY $DIR/my.cnf /etc/mysql/my.cnf
