/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import emailValidator from 'email-validator';
import { MailContent, MailService } from '@pia/lib-service-core';

import { runTransaction } from '../db';
import { config } from '../config';
import { userserviceClient } from '../clients/userserviceClient';
import { loggingserviceClient } from '../clients/loggingserviceClient';
import { PendingDeletionRepository } from '../repositories/pendingDeletionRepository';
import { PersonalDataRepository } from '../repositories/personalDataRepository';
import {
  PendingDeletionReq,
  PendingDeletionRes,
} from '../models/pendingDeletion';

export class PendingDeletionService {
  /**
   * Executes a deletion no matter if it is a new one or one from the db
   */
  public static async executeDeletion(
    deletion: PendingDeletionReq
  ): Promise<void> {
    return runTransaction(async (transaction) => {
      await PersonalDataRepository.deletePersonalData(deletion.proband_id, {
        transaction,
      });
      if (deletion.id) {
        await PendingDeletionRepository.deletePendingDeletion(
          deletion.proband_id,
          { transaction }
        );
      }
      await userserviceClient.patchProband(deletion.proband_id, {
        complianceContact: false,
      });
      await loggingserviceClient.createSystemLog({
        requestedBy: deletion.requested_by,
        requestedFor: deletion.requested_for,
        type: 'personal',
      });
    });
  }

  public static async deletePendingDeletion(pseudonym: string): Promise<void> {
    return runTransaction(async (transaction) => {
      await PendingDeletionRepository.deletePendingDeletion(pseudonym, {
        transaction,
      });
    });
  }

  /**
   * Creates a new pending deletion and informs the user to confirm this
   */
  public static async createPendingDeletion(
    deletion: PendingDeletionReq
  ): Promise<PendingDeletionRes> {
    if (!emailValidator.validate(deletion.requested_for)) {
      throw Boom.badData('The username to confirm needs to be an email.');
    }
    const studyName = await userserviceClient.getStudyOfProband(
      deletion.proband_id
    );
    if (!studyName) {
      throw Boom.notFound('Could not find study of proband');
    }

    return runTransaction(async (transaction) => {
      const pendingDeletion =
        await PendingDeletionRepository.createPendingDeletion(
          { ...deletion, study: studyName },
          { transaction }
        ).catch((err) => {
          console.error(err);
          throw Boom.preconditionFailed(
            'There is already one pending deletion for this user.'
          );
        });
      await MailService.sendMail(
        deletion.requested_for,
        PendingDeletionService._createProbandDeletionEmailContent(
          pendingDeletion.proband_id
        )
      ).catch((err: Error) => {
        console.log(err);
        throw Boom.badData('PM could not be reached via email.');
      });
      return pendingDeletion;
    });
  }

  private static _createProbandDeletionEmailContent(
    pseudonym: string
  ): MailContent {
    const confirmationURL =
      config.webappUrl +
      `/admin/probands-personal-info?probandIdToDelete=${pseudonym}&type=personal`;
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
