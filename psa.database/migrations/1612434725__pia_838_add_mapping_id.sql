CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;
	ALTER TABLE IF EXISTS users
	    ADD COLUMN IF NOT EXISTS mapping_id uuid NOT NULL DEFAULT uuid_generate_v4();

	-- we need to add the UNIQUE INDEX separately otherwise it will ALWAYS get added!
	CREATE UNIQUE INDEX IF NOT EXISTS users_mapping_id_key ON users (mapping_id);
	-- 1612434724__pia_2490_remove_users_mapping_constraints.sql will remove duplicate constraints
COMMIT;
