/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Questionnaire instances with status "in_progress" should be deleted when the corresponding
 * questionnaire is deactivated. This was not the case in the past, but is from now on.
 *
 * This migration will delete all questionnaire instances of deactivated questionnaires which
 * are still "in_progress". As a result, we have consistent contents within the questionnaire (instances)
 * tables for the past and the future.
 */
DELETE FROM questionnaire_instances WHERE id IN (
    SELECT qi.id
    FROM questionnaire_instances qi
        INNER JOIN questionnaires q
            ON qi.questionnaire_id = q.id AND qi.questionnaire_version = q.VERSION
    WHERE q.active = FALSE
      AND status = 'in_progress'
);