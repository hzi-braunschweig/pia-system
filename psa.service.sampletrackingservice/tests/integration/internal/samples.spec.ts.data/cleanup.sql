/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;
SET session_replication_role = replica;

DELETE FROM blood_samples;
DELETE FROM lab_observations;
DELETE FROM lab_results;
DELETE FROM probands;
DELETE FROM studies;

SET session_replication_role = DEFAULT;
COMMIT;
