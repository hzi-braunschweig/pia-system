/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { runTransaction } = require('../db');
const personalDataRepository = require('../repositories/personalDataRepository');
const pendingDeletionRepository = require('../repositories/pendingDeletionRepository');
const loggingserviceClient = require('../clients/loggingserviceClient');
const authserviceClient =
  require('../clients/authserviceClient').AuthserviceClient;
const userserviceClient = require('../clients/userserviceClient');
const mailService = require('./mailService');
const emailValidator = require('email-validator');
const { config } = require('../config');

class PendingDeletionService {
  /**
   * Executes a deletion no matter if it is a new one or one from the db
   * @param {PendingDeletionReq} deletion the deletion that should be executed
   * @return {Promise<void>}
   */
  static async executeDeletion(deletion) {
    return runTransaction(async (transaction) => {
      await personalDataRepository.deletePersonalData(deletion.proband_id, {
        transaction,
      });
      if (deletion.id) {
        await pendingDeletionRepository.deletePendingDeletion(
          deletion.proband_id,
          { transaction }
        );
      }
      await authserviceClient.updateUser({
        username: deletion.proband_id,
        account_status: 'deactivated',
      });
      await loggingserviceClient.createSystemLog({
        requestedBy: deletion.requested_by,
        requestedFor: deletion.requested_for,
        timestamp: new Date(),
        type: 'personal',
      });
    });
  }

  static async deletePendingDeletion(probandId) {
    return runTransaction(async (transaction) => {
      await pendingDeletionRepository.deletePendingDeletion(probandId, {
        transaction,
      });
      await authserviceClient.updateUser({
        username: probandId,
        account_status: 'active',
      });
    });
  }

  /**
   * Creates a new pending deletion and informs the user to confirm this
   * @param {PendingDeletionReq} deletion the pending deletion that should be created
   * @return {Promise<PendingDeletionRes>}
   */
  static async createPendingDeletion(deletion) {
    if (!emailValidator.validate(deletion.requested_for)) {
      throw Boom.badData('The username to confirm needs to be an email.');
    }
    const primaryStudy = await userserviceClient.getPrimaryStudy(
      deletion.proband_id
    );
    return runTransaction(async (transaction) => {
      const pendingDeletion = await pendingDeletionRepository
        .createPendingDeletion(
          { ...deletion, study: primaryStudy.name },
          { transaction }
        )
        .catch((err) => {
          console.error(err);
          throw Boom.preconditionFailed(
            'There is already one pending deletion for this user.'
          );
        });
      await mailService
        .sendMail(
          deletion.requested_for,
          PendingDeletionService._createProbandDeletionEmailContent(
            pendingDeletion.proband_id
          )
        )
        .catch(async (err) => {
          console.log(err);
          throw Boom.badData('PM could not be reached via email.');
        });
      await authserviceClient.updateUser({
        username: deletion.proband_id,
        account_status: 'deactivation_pending',
      });
      return pendingDeletion;
    });
  }

  static _createProbandDeletionEmailContent(probandId) {
    const confirmationURL =
      config.webappUrl +
      `/probands-personal-info?probandIdToDelete=${probandId}&type=personal`;
    return {
      subject: 'PIA - Sie wurden gebeten eine Kontaktsperre zu bestätigen',
      text:
        'Ein:e andere:r Probandenmanager:in möchte die "Kontaktsperre" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:\n' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.\n' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.\n',
      html:
        'Ein:e andere:r Probandenmanager:in möchte die "Kontaktsperre" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Kontaktsperre:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:<br>' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.<br>' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.<br>',
    };
  }
}

module.exports = PendingDeletionService;
