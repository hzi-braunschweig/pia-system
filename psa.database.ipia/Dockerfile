FROM postgres:10.20@sha256:9cac330e5a37a94418b1385bddd555a13c40ecd86266ac23b13101d74999c3dc AS base

FROM busybox:1.36.1@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79 AS patch
WORKDIR /
COPY --from=base /docker-entrypoint.sh /docker-entrypoint.sh
# check that we are patching the correct file!
# if the postgres version changes and the file is changed
# we probably should also update our patch
RUN echo "345f990010dee3e261b2047a4468a6b5  docker-entrypoint.sh" | md5sum -c
ARG DIR=.
COPY $DIR/migration.patch /migration.patch
# we need to patch the original docker-entrypoint
# so that it starts a local postgres, runs our migration
# scripts on that instance and stops it afterwards
RUN patch docker-entrypoint.sh migration.patch

# we are using jobber instead of cron because cron is dropping the environment
# before spawning a child.
# Therefore we would have a problem because inside the spawned cron child we don't
# have the auth information (that is only inside the parent process).
FROM golang:1.20.5-buster@sha256:eb3f9ac805435c1b2c965d63ce460988e1000058e1f67881324746362baf9572 AS build-jobber

WORKDIR /go
RUN git clone https://github.com/dshearer/jobber.git
WORKDIR /go/jobber
RUN git checkout v1.4.4
RUN make

FROM base AS final

ENV TZ=UTC

ARG DIR=.

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

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh", "/docker-entrypoint.sh"]
CMD ["/usr/bin/start.sh"]
