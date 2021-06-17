FROM postgres:10.17@sha256:b409dbc9aeea56e39ae8583bcfd9139dfd21122cce8e39e6783e14a6abc5d6bf AS base

FROM busybox:1.33.1@sha256:930490f97e5b921535c153e0e7110d251134cc4b72bbb8133c6a5065cc68580d AS patch
WORKDIR /
COPY --from=base /docker-entrypoint.sh /docker-entrypoint.sh
# check that we are patching the correct file!
# if the postgres version changes and the file is changed
# we probably should also update our patch
RUN echo "fb04850d2001f4c6e8f96f795b9a71a6  docker-entrypoint.sh" | md5sum -c
ARG DIR=
COPY $DIR/migration.patch /migration.patch
# we need to patch the original docker-entrypoint
# so that it starts a local postgres, runs our migration
# scripts on that instance and stops it afterwards
RUN patch docker-entrypoint.sh migration.patch

# we are using jobber instead of cron because cron is dropping the environment
# before spawning a child.
# Therefore we would have a problem because inside the spawned cron child we don't
# have the auth information (that is only inside the parent process).
FROM golang:1.16.5-buster@sha256:9d8f70f7f67e461ae75c148ee66394f4242f4b359c27222c31aeea1851c39d8f AS build-jobber

WORKDIR /go
RUN git clone https://github.com/dshearer/jobber.git
WORKDIR /go/jobber
RUN git checkout v1.4.4
RUN make

FROM base AS final

ENV TZ=UTC

ARG DIR=

COPY --from=patch /docker-entrypoint.sh /docker-entrypoint.sh

COPY --from=build-jobber /go/jobber/bin/jobber /usr/bin/
COPY --from=build-jobber /go/jobber/bin/jobbermaster /usr/libexec/
COPY --from=build-jobber /go/jobber/bin/jobberrunner /usr/libexec/
COPY --from=build-jobber /go/jobber/bin/jobber.conf /etc/jobber.conf

RUN mkdir -p /usr/local/var/jobber/0/ mkfifo /usr/local/var/jobber/0/cmd.sock
COPY $DIR/jobber.conf /root/.jobber
RUN chmod og-rwx /root/.jobber

COPY $DIR/db_init_scripts/*.* /docker-entrypoint-initdb.d/
COPY $DIR/apply_in_container.sh /apply_in_container.sh
COPY $DIR/postgresql.conf /tmp_config/postgresql.conf
COPY $DIR/pg_hba.conf /tmp_config/pg_hba.conf
COPY $DIR/migrations/*.* /migrations/
COPY $DIR/scripts/* /usr/bin
COPY $DIR/pg_hba-temp_server.conf /etc/postgres/pg_hba-temp_server.conf

CMD /usr/bin/start.sh
HEALTHCHECK CMD PGPASSWORD=$POSTGRES_PASSWORD /usr/bin/pg_isready -U $POSTGRES_USER -h localhost -d $POSTGRES_DB