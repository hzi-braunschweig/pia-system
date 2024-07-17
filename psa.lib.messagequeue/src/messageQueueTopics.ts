/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum MessageQueueTopic {
  COMPLIANCE_CREATED = 'compliance.created', //	compliance was filled out by proband

  FEEDBACKSTATISTIC_CONFIGURATION_UPDATED = 'feedbackstatistic_configuration.updated', // feedback statistic configuration got created or updated
  FEEDBACKSTATISTIC_OUTDATED = 'feedbackstatistic.outdated', // feedback statistic is outdated and needs to be recalculated

  PROBAND_CREATED = 'proband.created', //	proband was created
  PROBAND_DELETED = 'proband.deleted', //	proband's data was deleted
  PROBAND_DEACTIVATED = 'proband.deactivated', //	proband was deactivated and should not receive any new questionnaires
  PROBAND_LOGGED_IN = 'proband.logged_in', //	proband logged in
  PROBAND_REGISTERED = 'proband.registered', //	proband registered
  PROBAND_EMAIL_VERIFIED = 'proband.email_verified', //	proband successfully verified their email after registration

  QUESTIONNAIRE_INSTANCE_CREATED = 'questionnaire_instance.created', //	questionnaire instance was created
  QUESTIONNAIRE_INSTANCE_ACTIVATED = 'questionnaire_instance.activated', //	questionnaire instance was activated
  QUESTIONNAIRE_INSTANCE_ANSWERING_STARTED = 'questionnaire_instance.answering_started', //	questionnaire instance was started to be answered
  QUESTIONNAIRE_INSTANCE_RELEASED = 'questionnaire_instance.released', //	questionnaire instance moves to any "released*" status
  QUESTIONNAIRE_INSTANCE_EXPIRED = 'questionnaire_instance.expired', //	questionnaire instance has expired

  STUDY_DELETED = 'study.deleted', // study was deleted
}
