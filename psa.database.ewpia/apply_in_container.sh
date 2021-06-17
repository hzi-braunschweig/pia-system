echo "Copying config and ssl cert to ${PGDATA} ..."

cp /config/postgresql.conf ${PGDATA}/postgresql.conf
cp /config/pg_hba.conf ${PGDATA}/pg_hba.conf
cp /config/ssl/*.* ${PGDATA}/

chown postgres: ${PGDATA}/postgresql.conf
chown postgres: ${PGDATA}/pg_hba.conf

chown postgres: ${PGDATA}/ewpia.key
chown postgres: ${PGDATA}/ewpia.cert
chown postgres: ${PGDATA}/ca.cert

chmod 0600 ${PGDATA}/ewpia.key
chmod 0600 ${PGDATA}/ewpia.cert
chmod 0600 ${PGDATA}/ca.cert

echo "done"