FROM postgres:10.18@sha256:5606017577875f5d909e96a56216ac4dd7688c684d79f91547f34a0109fa6cd7 AS base

FROM busybox:1.34.0@sha256:89375f1d01c0e5259fed25db29694e4bbb1ee36189fa4eba81a4f75f672df840 AS patch
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
FROM golang:1.17.0-buster@sha256:df00207978706cb34c55d0228e88d8e61e8ccd663c1a1b31e9c019adf7da96cd AS build-jobber

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
