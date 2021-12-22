/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

-- migrate
DO
$$
    BEGIN
        IF NOT EXISTS(SELECT 1
                      FROM information_schema.columns
                      WHERE (table_name = 'users' OR table_name = 'probands')
                        AND column_name = 'compliance_contact') THEN

-- add compliance contact
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS compliance_contact boolean NOT NULL DEFAULT FALSE;
            UPDATE users
            SET compliance_contact = (account_status != 'deactivated' AND account_status != 'no_account');

-- correct default of compliance_...
            UPDATE users
            SET compliance_labresults = FALSE
            WHERE compliance_labresults IS NULL;
            UPDATE users
            SET compliance_samples = FALSE
            WHERE compliance_samples IS NULL;
            UPDATE users
            SET compliance_bloodsamples = FALSE
            WHERE compliance_bloodsamples IS NULL;

            ALTER TABLE users
                ALTER COLUMN compliance_labresults SET DEFAULT FALSE;
            ALTER TABLE users
                ALTER COLUMN compliance_labresults SET NOT NULL;
            ALTER TABLE users
                ALTER COLUMN compliance_samples SET DEFAULT FALSE;
            ALTER TABLE users
                ALTER COLUMN compliance_samples SET NOT NULL;
            ALTER TABLE users
                ALTER COLUMN compliance_bloodsamples SET DEFAULT FALSE;
            ALTER TABLE users
                ALTER COLUMN compliance_bloodsamples SET NOT NULL;
            ALTER TABLE study_users
                ALTER COLUMN access_level SET DEFAULT 'read';

        END IF;
    END
$$;
