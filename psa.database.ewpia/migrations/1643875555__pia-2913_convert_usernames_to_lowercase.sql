/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;
UPDATE public.compliances SET username = lower(username);

ALTER TABLE public.compliances
    ADD CONSTRAINT check_compliances_username_lowercase CHECK (username = lower(username));
COMMIT;
