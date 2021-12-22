/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DO
$$
    BEGIN
        IF NOT EXISTS(SELECT 1
                      FROM information_schema.columns
                      WHERE table_name = 'users'
                        AND column_name = 'study') THEN

            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS study TEXT REFERENCES studies (name);

            UPDATE users
            SET study = study_users.study_id
            FROM study_users
            WHERE users.username = study_users.user_id
              AND users.role = 'Proband';

            ALTER TABLE users
                ADD CONSTRAINT if_proband_then_study_is_not_null
                    CHECK ( (role <> 'Proband') OR (study IS NOT NULL) );

            DELETE FROM study_users WHERE user_id IN (SELECT username FROM users WHERE role = 'Proband');
        END IF;
    END
$$;
