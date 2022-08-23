/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

DELETE FROM answers;
DELETE FROM answer_options;
DELETE FROM questionnaire_instances;
DELETE FROM questions;
DELETE FROM questionnaires;
DELETE FROM study_users;
DELETE FROM probands;
DELETE FROM studies;

COMMIT;
