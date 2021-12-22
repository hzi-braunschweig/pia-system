/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DROP TABLE IF EXISTS public.testing_status;
DROP TRIGGER IF EXISTS answers_notify_delete ON public.answers;
DROP TRIGGER IF EXISTS answers_notify_insert ON public.answers;
DROP TRIGGER IF EXISTS answers_notify_update ON public.answers;
DROP TRIGGER IF EXISTS questionnaires_notify_delete ON public.questionnaires;
DROP TRIGGER IF EXISTS study_users_notify_delete ON public.study_users;
DROP TRIGGER IF EXISTS study_users_notify_insert ON public.study_users;

DROP TRIGGER IF EXISTS reset_on_insert_answer ON public.answers;
DROP TRIGGER IF EXISTS reset_on_update_answer ON public.answers;

DROP FUNCTION IF EXISTS public.answers_update_reset;
