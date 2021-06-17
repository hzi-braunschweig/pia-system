-- We are removing the constaints because the query in 1612434725__pia_838_add_mapping_id.sql WAS adding them on each call!

-- We need the limit to < 1024 entries because otherwise we could get:
-- ERROR:  out of shared memory
-- HINT:  You might need to increase max_locks_per_transaction.

DO $$
DECLARE r RECORD;
BEGIN
	FOR r IN
		SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE 'users_mapping_id_key%' LIMIT 512
	LOOP
		IF r.indexname <> 'users_mapping_id_key' THEN
			EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || r.indexname;
		END IF;
	END LOOP;
END;
$$
