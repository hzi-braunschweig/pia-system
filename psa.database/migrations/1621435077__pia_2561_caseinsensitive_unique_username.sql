BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS users_unique_username ON users (UPPER(username));
CREATE UNIQUE INDEX IF NOT EXISTS planned_probands_unique_user_id ON planned_probands (UPPER(user_id));

CREATE OR REPLACE FUNCTION check_username_exists(check_username text)
    RETURNS boolean
AS
$$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM users WHERE UPPER(username) = UPPER(check_username)));
END
$$ LANGUAGE plpgsql;

DELETE
FROM planned_probands
WHERE check_username_exists(user_id);

ALTER TABLE planned_probands
    DROP CONSTRAINT IF EXISTS username_not_yet_existing;
ALTER TABLE planned_probands
    ADD CONSTRAINT username_not_yet_existing CHECK ( NOT check_username_exists(user_id) );
END;
