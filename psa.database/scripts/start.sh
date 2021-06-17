#!/bin/sh

set -e

/usr/libexec/jobberrunner -u /usr/local/var/jobber/0/cmd.sock /root/.jobber&
exec /docker-entrypoint.sh postgres
