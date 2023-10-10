/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum MessageQueueTopic {
  PROBAND_CREATED = 'proband.created', //	Published when a proband was created
  PROBAND_DELETED = 'proband.deleted', //	Published when a proband's data were fully deleted
  PROBAND_DEACTIVATED = 'proband.deactivated', //	Published when a proband was deactivated and should not receive any new questionnaires
  PROBAND_LOGGED_IN = 'proband.logged_in', //	Published when a proband logged in
  PROBAND_REGISTERED = 'proband.registered', //	Published when a proband registered
  PROBAND_EMAIL_VERIFIED = 'proband.email_verified', //	Published when a proband successfully verified its email after registration
  COMPLIANCE_CREATED = 'compliance.created', //	Published when a compliance was filled out by a proband
  QUESTIONNAIRE_INSTANCE_RELEASED = 'questionnaire_instance.released', //	Published when a questionnaire instance moves to any "released[...]" status
  FEEDBACKSTATISTIC_CONFIGURATION_UPDATED = 'feedbackstatistic_configuration.updated', // Published when a feedbackstatistic configuration got created or updated
  FEEDBACKSTATISTIC_OUTDATED = 'feedbackstatistic.outdated', // Published when feedbackstatistic data should be recalculated
  STUDY_DELETED = 'study.deleted', // Published when a study was deleted
}
