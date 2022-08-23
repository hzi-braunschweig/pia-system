/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Replace existing function by new function which properly uses namespaced table access
 * (compare to 1643875555__pia-2913_convert_usernames_to_lowercase.sql line 76)
 */
ALTER TABLE public.planned_probands
    DROP CONSTRAINT pseudonym_not_yet_existing;

DROP FUNCTION IF EXISTS public.check_pseudonym_exists;
CREATE FUNCTION public.check_pseudonym_exists(check_pseudonym text) RETURNS boolean
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT EXISTS(SELECT 1 FROM public.probands WHERE pseudonym = check_pseudonym));
END
$$;

ALTER TABLE public.planned_probands
    ADD CONSTRAINT pseudonym_not_yet_existing CHECK ((NOT public.check_pseudonym_exists(user_id)));