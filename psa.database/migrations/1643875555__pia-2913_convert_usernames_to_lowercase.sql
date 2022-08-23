/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

-- triggers substantially slow down the migration, they will be recreated at the end
DROP TRIGGER IF EXISTS lab_results_notify_update ON public.lab_results;
DROP TRIGGER IF EXISTS questionnaire_instances_notify_update ON public.questionnaire_instances;

/**
 * Create column for pseudonyms which come from an external system
 *
 * The pseudonyms of probands of the study "ZIFCO-Studie" were created outside of
 * PIA in NatCoEdc. We have to keep those pseudonyms in mixed case characters to
 * still be able to fetch data from MODYS.
 */
ALTER TABLE public.probands ADD COLUMN IF NOT EXISTS external_id text;
UPDATE public.probands SET external_id = pseudonym WHERE study = 'ZIFCO-Studie' AND external_id IS NULL;

/**
 * Will also cascade update the following tables:
 *
 * public.pending_deletions
 * public.pending_partial_deletions
 * public.pending_compliance_changes
 * public.pending_study_changes
 * public.study_users
 */
UPDATE public.accounts SET username = lower(username);

/**
 * Get sure, usernames will also be lowercase in the future
 */
DROP INDEX IF EXISTS accounts_unique_username;
ALTER TABLE public.accounts
    DROP CONSTRAINT IF EXISTS check_accounts_username_lowercase,
    ADD CONSTRAINT check_accounts_username_lowercase CHECK (username = lower(username));

/**
 * Will also cascade update the following tables:
 *
 * public.pending_partial_deletions
 * public.pending_compliance_changes
 * public.users_to_contact
 * public.questionnaire_instances
 * public.questionnaire_instances_queued
 * public.notification_schedules
 * public.lab_results
 * public.blood_samples
 * public.user_files
 */
UPDATE public.probands SET pseudonym = lower(pseudonym);
UPDATE public.planned_probands SET user_id = lower(user_id);
UPDATE public.study_planned_probands SET user_id = lower(user_id);

/**
 * Get sure, pseudonyms will also be lowercase in the future
 */
ALTER TABLE public.probands
    ADD CONSTRAINT check_probands_pseudonym_lowercase CHECK (pseudonym = lower(pseudonym));

DROP INDEX IF EXISTS planned_probands_unique_user_id;
ALTER TABLE public.planned_probands
    ADD CONSTRAINT check_planned_probands_user_id_lowercase CHECK (user_id = lower(user_id));

/**
 * Remove uppercase conversion, as pseudonyms are now always lowercase by db constraints
 */
ALTER TABLE public.planned_probands
    DROP CONSTRAINT pseudonym_not_yet_existing;

DROP FUNCTION IF EXISTS public.check_pseudonym_exists;
CREATE FUNCTION public.check_pseudonym_exists(check_pseudonym text) RETURNS boolean
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM probands WHERE pseudonym = check_pseudonym));
END
$$;

ALTER TABLE public.planned_probands
    ADD CONSTRAINT pseudonym_not_yet_existing CHECK ((NOT public.check_pseudonym_exists(user_id)));

/**
 * Update remaining tables without cascade update
 */
UPDATE loggingservice.system_logs SET requested_by = lower(requested_by);
UPDATE loggingservice.system_logs SET requested_for = lower(requested_for);

UPDATE public.pending_deletions SET for_id = lower(for_id) WHERE type = 'proband';

UPDATE public.fcm_tokens SET pseudonym = lower(pseudonym);

-- recreate recently dropped triggers
CREATE TRIGGER lab_results_notify_update AFTER UPDATE ON public.lab_results FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();
CREATE TRIGGER questionnaire_instances_notify_update AFTER UPDATE ON public.questionnaire_instances FOR EACH ROW EXECUTE PROCEDURE public.table_update_notify();

COMMIT;


