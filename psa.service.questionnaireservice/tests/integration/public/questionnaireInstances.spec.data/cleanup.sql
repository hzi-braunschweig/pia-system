/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

DELETE FROM conditions;
DELETE FROM questionnaires;
DELETE FROM questions;
DELETE FROM answer_options;
DELETE FROM questionnaire_instances;
DELETE FROM answers;
DELETE FROM probands;
DELETE FROM studies;

COMMIT;
