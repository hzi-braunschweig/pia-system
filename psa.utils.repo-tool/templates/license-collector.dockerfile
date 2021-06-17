ARG VERSION=

# it is (currently) not possible to use a variable inside the mount of a RUN.
### TEMPLATE-MARKER: include-dependencies ####

FROM registry.netzlink.com/pia/psa.utils.repo-tool:${VERSION} AS base

RUN \
### TEMPLATE-MARKER: mount-dependencies ####
	REPO_DIR=/dependencies OUT_FILE=/licenses.csv node /app/index.js license

FROM scratch
COPY --from=base /licenses.csv /
