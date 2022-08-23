/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;
UPDATE personaldataservice.personal_data SET pseudonym = lower(pseudonym);

ALTER TABLE personaldataservice.personal_data
    ADD CONSTRAINT check_personal_data_pseudonym_lowercase CHECK (pseudonym = lower(pseudonym));

UPDATE personaldataservice.pending_deletions SET requested_by = lower(requested_by);
UPDATE personaldataservice.pending_deletions SET requested_for = lower(requested_for);
UPDATE personaldataservice.pending_deletions SET proband_id = lower(proband_id);

ALTER TABLE personaldataservice.pending_deletions
    ADD CONSTRAINT check_pending_deletions_requested_by_lowercase CHECK (requested_by = lower(requested_by)),
    ADD CONSTRAINT check_pending_deletions_requested_for_lowercase CHECK (requested_for = lower(requested_for)),
    ADD CONSTRAINT check_pending_deletions_proband_id_lowercase CHECK (proband_id = lower(proband_id));
COMMIT;
