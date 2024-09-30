/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Questionnaire } from '../models/questionnaire';
import { Proband } from '../models/proband';

/**
 * Returns true if a proband does meet all requirements of a questionnaire
 */
export function isQuestionnaireAvailableToProband(
  questionnaire: Questionnaire,
  proband: Proband
): boolean {
  return (
    isComplianceSatisfied(questionnaire, proband) &&
    isTestProbandSatisfied(questionnaire, proband) &&
    isUserActiveOrQuestionnaireForResearchTeam(questionnaire, proband)
  );
}

export function isComplianceSatisfied(
  questionnaire: Questionnaire,
  proband: Proband
): boolean {
  // either the questionnaire does not need any compliance, or the proband did comply to give samples
  return !questionnaire.compliance_needed || proband.compliance_samples;
}

export function isTestProbandSatisfied(
  questionnaire: Questionnaire,
  proband: Proband
): boolean {
  // either the questionnaire is not for test probands, or the proband is a test proband
  return questionnaire.publish !== 'testprobands' || proband.is_test_proband;
}

export function isUserActiveOrQuestionnaireForResearchTeam(
  questionnaire: Questionnaire,
  proband: Proband
): boolean {
  return (
    // if the user is active, we continue, but if not, the questionnaire should not be explicitly for probands
    isUserActiveInStudy(proband) || questionnaire.type !== 'for_probands'
  );
}

export function isUserActiveInStudy(user: Proband): boolean {
  return user.status === 'active';
}
