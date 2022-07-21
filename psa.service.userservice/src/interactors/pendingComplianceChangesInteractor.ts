/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import validator from 'email-validator';

import {
  AccessToken,
  getPrimaryRealmRole,
  MailContent,
  MailService,
  Nullable,
} from '@pia/lib-service-core';
import pgHelper from '../services/postgresqlHelper';
import { config } from '../config';
import { loggingserviceClient } from '../clients/loggingserviceClient';
import { runTransaction } from '../db';
import {
  PendingComplianceChange,
  PendingComplianceChangeRequest,
} from '../models/pendingComplianceChange';
import { DbStudy } from '../models/study';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { ProfessionalAccount } from '../models/account';
import { AccountNotFound } from '../errors';
import { ProbandService } from '../services/probandService';
import { getArrayIntersection } from '../helpers/arrayIntersection';

/**
 * @description interactor that handles pending deletion requests based on users permissions
 */
export class PendingComplianceChangesInteractor {
  /**
   * Gets a pending compliance change from DB if user is allowed to
   */
  public static async getPendingComplianceChange(
    decodedToken: AccessToken,
    id: string
  ): Promise<PendingComplianceChange> {
    let pendingComplianceChange: PendingComplianceChange;
    try {
      pendingComplianceChange = (await pgHelper.getPendingComplianceChange(
        id
      )) as PendingComplianceChange;
    } catch (err) {
      console.log(err);
      throw Boom.notFound('The pending compliance change was not found');
    }
    if (
      pendingComplianceChange.requested_for !== decodedToken.username &&
      pendingComplianceChange.requested_by !== decodedToken.username
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to get this pending compliance change'
      );
    } else {
      return pendingComplianceChange;
    }
  }

  /**
   * Gets a pending compliance change for a proband from DB if user is allowed to
   */
  public static async getPendingComplianceChanges(
    studyName: string
  ): Promise<PendingComplianceChange[]> {
    return (await pgHelper.getPendingComplianceChangesOfStudy(
      studyName
    )) as PendingComplianceChange[];
  }

  /**
   * Creates the pending compliance change in DB if it does not exist and the requester is allowed to
   */
  public static async createPendingComplianceChange(
    decodedToken: AccessToken,
    data: PendingComplianceChangeRequest
  ): Promise<PendingComplianceChangeRequest> {
    const userName = decodedToken.username;

    let requestedFor: ProfessionalAccount;
    try {
      requestedFor = await ProfessionalAccountService.getProfessionalAccount(
        data.requested_for
      );
    } catch (err) {
      if (err instanceof AccountNotFound) {
        throw Boom.badData('The one who should confirm could not be found');
      }
      throw err;
    }

    if (getPrimaryRealmRole(decodedToken) !== requestedFor.role) {
      throw Boom.badData('The one who should confirm has the wrong role');
    }

    let proband;
    try {
      proband = await ProbandService.getProbandByPseudonymOrFail(
        data.proband_id,
        getArrayIntersection(decodedToken.studies, requestedFor.studies)
      );
    } catch (err) {
      console.log(err);
      throw Boom.notFound('Proband not found');
    }

    let studyOfProband;
    try {
      studyOfProband = (await pgHelper.getStudy(proband.study)) as DbStudy;
    } catch (err) {
      console.log(err);
      throw Boom.badData('Study not found');
    }

    if (
      studyOfProband.has_four_eyes_opposition &&
      studyOfProband.has_compliance_opposition
    ) {
      if (
        data.requested_for === userName ||
        requestedFor.role !== 'ProbandenManager' ||
        !validator.validate(data.requested_for)
      ) {
        throw Boom.badData(
          'Some data was not fitting, is the PMs username an email address?'
        );
      }
      data.requested_by = userName;

      const existingPendingComplianceChange =
        (await pgHelper.getPendingComplianceChangeForProbandIdIfExisting(
          data.proband_id
        )) as Nullable<PendingComplianceChange>;

      if (existingPendingComplianceChange) {
        throw Boom.forbidden('Proband not found or changes already requested');
      }

      const pendingComplianceChange =
        (await pgHelper.createPendingComplianceChange(
          data
        )) as PendingComplianceChange;

      const result = await MailService.sendMail(
        data.requested_for,
        this.createProbandComplianceChangeEmailContent(
          this.createProbandComplianceChangeConfirmationUrl(
            pendingComplianceChange.id
          )
        )
      ).catch(async (err) => {
        await pgHelper.deletePendingComplianceChange(
          pendingComplianceChange.id
        );
        console.log(err);
        throw Boom.badData(
          'PM could not be reached via email: ' + (err as Error).toString()
        );
      });
      if (!result) {
        throw Boom.badData('PM could not be reached via email');
      }
      return pendingComplianceChange;
    }
    // No 4-eye confirmation, change instantly
    else if (studyOfProband.has_compliance_opposition) {
      data.requested_by = userName;
      return await runTransaction(async (t) => {
        await pgHelper.updatePendingComplianceChange(
          -1,
          { transaction: t },
          data
        );
        await loggingserviceClient.createSystemLog({
          requestedBy: userName,
          requestedFor: data.requested_for,
          type: 'compliance',
        });
        return data;
      }).catch((err) => {
        console.log(err);
        throw Boom.boomify(err as Error);
      });
    } else {
      throw Boom.forbidden('This operation cannot be done for this study');
    }
  }

  /**
   * Updates a pending compliance change in DB, confirms changes and changes all data
   */
  public static async updatePendingComplianceChange(
    decodedToken: AccessToken,
    id: string
  ): Promise<PendingComplianceChange> {
    let pendingComplianceChange: PendingComplianceChange;
    try {
      pendingComplianceChange = (await pgHelper.getPendingComplianceChange(
        id
      )) as PendingComplianceChange;
    } catch (err) {
      console.log(err);
      throw Boom.notFound(
        'The pending compliance change could not be updated: ' +
          (err as Error).toString()
      );
    }
    if (pendingComplianceChange.requested_for !== decodedToken.username) {
      throw Boom.forbidden(
        'The requester is not allowed to update this pending compliance change'
      );
    }
    return await runTransaction(async (t) => {
      await pgHelper.updatePendingComplianceChange(id, { transaction: t });
      await loggingserviceClient.createSystemLog({
        requestedBy: pendingComplianceChange.requested_by,
        requestedFor: pendingComplianceChange.requested_for,
        type: 'compliance',
      });
      return pendingComplianceChange;
    }).catch((err) => {
      console.log(err);
      throw Boom.notFound(
        'The pending compliance change could not be updated: ' +
          (err as Error).toString()
      );
    });
  }

  /**
   * Deletes a pending compliance change and cancels the change request
   */
  public static async deletePendingComplianceChange(
    decodedToken: AccessToken,
    id: string
  ): Promise<PendingComplianceChange> {
    try {
      const pendingComplianceChange =
        (await pgHelper.getPendingComplianceChange(
          id
        )) as PendingComplianceChange;
      await ProbandService.assertProbandExistsWithStudyAccess(
        pendingComplianceChange.proband_id,
        decodedToken.studies
      );
      return (await pgHelper.deletePendingComplianceChange(
        id
      )) as PendingComplianceChange;
    } catch (err) {
      console.log(err);
      throw Boom.notFound(
        'The pending compliance change or proband was not found'
      );
    }
  }

  private static createProbandComplianceChangeEmailContent(
    confirmationURL: string
  ): MailContent {
    return {
      subject:
        'PIA - Sie wurden gebeten eine Einwilligungsänderung zu bestätigen',
      text:
        'Ein:e andere:r Probandenmanager:in möchte die Einwilligungen eines Teilnehmenden ändern und hat Sie als Änderungspartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
        '\n\n' +
        confirmationURL +
        '\n\n' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:\n' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Änderungspartner:in telefonisch übergeben kann.\n' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.\n',
      html:
        'Ein:e andere:r Probandenmanager:in möchte die Einwilligungen eines Teilnehmenden ändern und hat Sie als Änderungspartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:<br>' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Änderungspartner:in telefonisch übergeben kann.<br>' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.<br>',
    };
  }

  private static createProbandComplianceChangeConfirmationUrl(
    id: number
  ): string {
    return (
      config.webappUrl +
      `/admin/probands-personal-info?pendingComplianceChangeId=${id}&type=compliance`
    );
  }
}
