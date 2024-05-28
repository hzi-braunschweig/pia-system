#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

echo "Copying config to ${PGDATA} ..."

cp /config/postgresql.conf ${PGDATA}/postgresql.conf
cp /config/pg_hba.conf ${PGDATA}/pg_hba.conf

chown postgres: ${PGDATA}/postgresql.conf
chown postgres: ${PGDATA}/pg_hba.conf

echo "done"