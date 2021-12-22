/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

CREATE OR REPLACE FUNCTION check_pseudonym_exists(check_pseudonym text)
    RETURNS boolean
AS
$$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM probands WHERE UPPER(pseudonym) = UPPER(check_pseudonym)));
END
$$ LANGUAGE plpgsql;


DO
$$
    BEGIN
        IF EXISTS(SELECT 1
                  FROM information_schema.columns
                  WHERE table_name = 'users') THEN

            -- Create and insert accounts
            CREATE TABLE accounts (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                salt TEXT NULL,
                role TEXT NOT NULL,
                pw_change_needed BOOLEAN DEFAULT TRUE,
                number_of_wrong_attempts INT,
                third_wrong_password_at TIMESTAMP NULL,
                initial_password_validity_date TIMESTAMP NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS accounts_unique_username ON accounts (UPPER(username));

            INSERT INTO accounts (
                username,
                password,
                salt,
                role,
                pw_change_needed,
                number_of_wrong_attempts,
                third_wrong_password_at,
                initial_password_validity_date
            )
                SELECT username,
                       password,
                       salt,
                       role,
                       pw_change_needed,
                       number_of_wrong_attempts,
                       third_wrong_password_at,
                       initial_password_validity_date
                FROM users
                WHERE account_status = 'account'::account_status_type OR role != 'Proband';

            -- Create and insert probands
            CREATE TABLE probands (
                pseudonym TEXT PRIMARY KEY,
                ids TEXT UNIQUE NULL,
                mapping_id uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
                study TEXT NOT NULL,
                status proband_status_type DEFAULT 'active'::proband_status_type NOT NULL,
                study_center TEXT DEFAULT NULL,
                examination_wave INT DEFAULT 1,
                compliance_labresults BOOLEAN DEFAULT TRUE NOT NULL,
                compliance_samples BOOLEAN DEFAULT TRUE NOT NULL,
                compliance_bloodsamples BOOLEAN DEFAULT TRUE NOT NULL,
                compliance_contact boolean DEFAULT FALSE NOT NULL,
                logging_active BOOLEAN DEFAULT TRUE,
                needs_material BOOLEAN DEFAULT FALSE,
                is_test_proband BOOLEAN DEFAULT FALSE,
                first_logged_in_at DATE NULL,

                CONSTRAINT fk_study
                    FOREIGN KEY (study)
                        REFERENCES studies (name)
            );

            INSERT INTO probands (
                pseudonym,
                ids,
                mapping_id,
                study,
                status,
                study_center,
                examination_wave,
                compliance_labresults,
                compliance_samples,
                compliance_bloodsamples,
                compliance_contact,
                logging_active,
                needs_material,
                is_test_proband,
                first_logged_in_at
            )
                SELECT username,
                       ids,
                       mapping_id,
                       study,
                       status,
                       study_center,
                       examination_wave,
                       compliance_labresults,
                       compliance_samples,
                       compliance_bloodsamples,
                       compliance_contact,
                       logging_active,
                       needs_material,
                       is_test_proband,
                       first_logged_in_at
                FROM users
                WHERE role = 'Proband';

            -- Prepare for users table removal
            ALTER TABLE users_to_contact
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE pending_deletions
                DROP CONSTRAINT fk_requested_by,
                DROP CONSTRAINT fk_requested_for,
                ADD CONSTRAINT fk_requested_by
                    FOREIGN KEY (requested_by)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                ADD CONSTRAINT fk_requested_for
                    FOREIGN KEY (requested_for)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE pending_partial_deletions
                DROP CONSTRAINT fk_requested_by,
                DROP CONSTRAINT fk_requested_for,
                DROP CONSTRAINT fk_proband_id,
                ADD CONSTRAINT fk_requested_by
                    FOREIGN KEY (requested_by)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                ADD CONSTRAINT fk_requested_for
                    FOREIGN KEY (requested_for)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                ADD CONSTRAINT fk_proband_id
                    FOREIGN KEY (proband_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE pending_compliance_changes
                DROP CONSTRAINT fk_requested_by,
                DROP CONSTRAINT fk_requested_for,
                DROP CONSTRAINT fk_proband_id,
                ADD CONSTRAINT fk_requested_by
                    FOREIGN KEY (requested_by)
                        REFERENCES accounts(username)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
                ADD CONSTRAINT fk_requested_for
                    FOREIGN KEY (requested_for)
                        REFERENCES accounts(username)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
                ADD CONSTRAINT fk_proband_id
                    FOREIGN KEY (proband_id)
                        REFERENCES probands(pseudonym)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE;

            ALTER TABLE pending_study_changes
                DROP CONSTRAINT fk_requested_by,
                DROP CONSTRAINT fk_requested_for,
                ADD CONSTRAINT fk_requested_by
                    FOREIGN KEY (requested_by)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                ADD CONSTRAINT fk_requested_for
                    FOREIGN KEY (requested_for)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE planned_probands DROP CONSTRAINT username_not_yet_existing;
            DROP FUNCTION IF EXISTS public.check_username_exists;

            DELETE FROM planned_probands WHERE check_pseudonym_exists(user_id);

            ALTER TABLE planned_probands
                ADD CONSTRAINT pseudonym_not_yet_existing CHECK ( NOT check_pseudonym_exists(user_id) );

            ALTER TABLE study_users
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES accounts(username)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE questionnaire_instances
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE questionnaire_instances_queued
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE notification_schedules
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE lab_results
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE blood_samples
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            ALTER TABLE user_files
                DROP CONSTRAINT fk_user_id,
                ADD CONSTRAINT fk_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES probands(pseudonym)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;

            -- Delete users table
            DROP TABLE users;

        END IF;
    END
$$;
