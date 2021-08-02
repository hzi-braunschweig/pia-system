#
# SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#

echo "Copying config and ssl cert to ${PGDATA} ..."

cp /config/postgresql.conf ${PGDATA}/postgresql.conf
cp /config/pg_hba.conf ${PGDATA}/pg_hba.conf
cp /config/ssl/*.* ${PGDATA}/

chown postgres: ${PGDATA}/postgresql.conf
chown postgres: ${PGDATA}/pg_hba.conf

chown postgres: ${PGDATA}/qpia.key
chown postgres: ${PGDATA}/qpia.cert
chown postgres: ${PGDATA}/ca.cert

chmod 0600 ${PGDATA}/qpia.key
chmod 0600 ${PGDATA}/qpia.cert
chmod 0600 ${PGDATA}/ca.cert

echo "done"