/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

-- migrate
DO
$$
    BEGIN
        IF EXISTS(SELECT 1
                  FROM information_schema.columns
                  WHERE table_name = 'users'
                    AND column_name = 'study_status') THEN

            UPDATE users
            SET study_status   = 'active',
                account_status = 'no_account'
            WHERE study_status IN ('active', 'deletion_pending')
              AND account_status IN ('no_account');
            UPDATE users
            SET study_status   = 'active',
                account_status = 'account'
            WHERE study_status IN ('active', 'deletion_pending')
              AND account_status IN ('active', 'deactivation_pending');
            UPDATE users
            SET study_status   = 'deactivated',
                account_status = 'no_account'
            WHERE study_status IN ('active', 'deletion_pending')
              AND account_status IN ('deactivated');

            UPDATE users
            SET study_status   = 'deleted',
                account_status = 'no_account'
            WHERE study_status IN ('deleted')
              AND account_status IN ('no_account');
            UPDATE users
            SET study_status   = 'deleted',
                account_status = 'no_account'
            WHERE study_status IN ('deleted')
              AND account_status IN ('active', 'deactivation_pending');
            UPDATE users
            SET study_status   = 'deleted',
                account_status = 'no_account'
            WHERE study_status IN ('deleted')
              AND account_status IN ('deactivated');

            UPDATE users
            SET study_status   = 'deactivated',
                account_status = 'no_account'
            WHERE study_status IN ('deactivated')
              AND account_status IN ('no_account');
            UPDATE users
            SET study_status   = 'deactivated',
                account_status = 'account'
            WHERE study_status IN ('deactivated')
              AND account_status IN ('active', 'deactivation_pending');
            UPDATE users
            SET study_status   = 'deactivated',
                account_status = 'no_account'
            WHERE study_status IN ('deactivated')
              AND account_status IN ('deactivated');


            ALTER TABLE users
                RENAME COLUMN study_status TO status;

            ALTER TABLE users
                ALTER COLUMN status DROP DEFAULT;
            ALTER TABLE users
                ALTER COLUMN account_status DROP DEFAULT;

            CREATE TYPE proband_status_type AS ENUM ('active', 'deactivated', 'deleted');
            CREATE TYPE account_status_type AS ENUM ('account', 'no_account');

            ALTER TABLE users
                ALTER status TYPE proband_status_type USING (status::proband_status_type);
            ALTER TABLE users
                ALTER account_status TYPE account_status_type USING (account_status::account_status_type);

            ALTER TABLE users
                ALTER status SET NOT NULL;
            ALTER TABLE users
                ALTER status SET DEFAULT 'active';
            ALTER TABLE users
                ALTER account_status SET NOT NULL;
            ALTER TABLE users
                ALTER account_status SET DEFAULT 'no_account';
        END IF;
    END
$$;

