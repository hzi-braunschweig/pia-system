/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken, MailContent, MailService } from '@pia/lib-service-core';
import Boom from '@hapi/boom';
import { runTransaction } from '../db';
import { loggingserviceClient } from '../clients/loggingserviceClient';
import { hasExistingPseudonymPrefix } from '../helpers/studyHelper';
import { config } from '../config';
import pgHelper from '../services/postgresqlHelper';
import {
  PendingStudyChange,
  PendingStudyChangeRequest,
} from '../models/pendingStudyChange';
import {
  AccountNotFound,
  FourEyeOppositionPartnerLacksPermissionError,
  FourEyeOppositionPartnerNotFoundError,
  FourEyeOppositionPendingChangeAlreadyExistsError,
  FourEyeOppositionSelfNotAllowedAsPartnerError,
  MissingPermissionError,
  StudyInvalidPsyeudonymPrefixError,
} from '../errors';
import { getRepository } from 'typeorm';
import { StudyAccess } from '../entities/studyAccess';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { AccessLevel } from '@pia-system/lib-http-clients-internal';
import { ProfessionalAccount } from '../models/account';

export class PendingStudyChangesInteractor {
  /**
   * Creates the pending study change in DB if it does not exist and the requester is allowed to
   */
  public static async createPendingStudyChange(
    decodedToken: AccessToken,
    data: PendingStudyChangeRequest
  ): Promise<PendingStudyChange> {
    const requestedByUsername = decodedToken.username;

    if (
      !(await this.hasStudyAccessLevel(
        requestedByUsername,
        data.study_id,
        'admin'
      ))
    ) {
      throw new MissingPermissionError(
        'You do not have permission to change this study.'
      );
    }

    let requestedFor: ProfessionalAccount;
    try {
      requestedFor = await ProfessionalAccountService.getProfessionalAccount(
        data.requested_for
      );
    } catch (err) {
      if (err instanceof AccountNotFound) {
        throw new FourEyeOppositionPartnerNotFoundError(
          'The person to confirm does not exist as a "Forscher"'
        );
      }
      throw err;
    }

    if (requestedFor.role !== 'Forscher') {
      throw new FourEyeOppositionPartnerNotFoundError(
        'The person to confirm does not exist as a "Forscher"'
      );
    }

    if (requestedFor.username === requestedByUsername) {
      throw new FourEyeOppositionSelfNotAllowedAsPartnerError(
        'You cannot request for yourself'
      );
    }

    if (
      !(await this.hasStudyAccessLevel(
        requestedFor.username,
        data.study_id,
        'admin'
      ))
    ) {
      throw new FourEyeOppositionPartnerLacksPermissionError(
        'The person to confirm does not have permission to change a study.'
      );
    }

    if (
      data.pseudonym_prefix_to &&
      !hasExistingPseudonymPrefix(data.pseudonym_prefix_to)
    ) {
      throw new StudyInvalidPsyeudonymPrefixError(
        'The given pseudonym prefix is not valid'
      );
    }

    const existingPendingStudyChange =
      (await pgHelper.getPendingStudyChangeForStudyIdIfExisting(
        data.study_id
      )) as PendingStudyChange | null;

    if (existingPendingStudyChange) {
      throw new FourEyeOppositionPendingChangeAlreadyExistsError(
        'Other changes to this study where already requested'
      );
    }

    const pendingStudyChange = (await pgHelper.createPendingStudyChange({
      ...data,
      requested_by: decodedToken.username,
    })) as PendingStudyChange;

    const result = await MailService.sendMail(
      data.requested_for,
      PendingStudyChangesInteractor.createStudyChangeEmailContent(
        pendingStudyChange.study_id,
        pendingStudyChange.id
      )
    ).catch((err) => {
      console.log(err);
      return false;
    });

    if (!result) {
      await pgHelper.deletePendingStudyChange(pendingStudyChange.id);
      throw Boom.badData('Forscher could not be reached via email');
    }
    return pendingStudyChange;
  }

  /**
   * Updates a pending study change in DB, confirms changes and changes all data
   */
  public static async updatePendingStudyChange(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingStudyChange> {
    const pendingStudyChange = (await pgHelper.getPendingStudyChange(
      id
    )) as PendingStudyChange;
    if (pendingStudyChange.requested_for !== decodedToken.username) {
      throw Boom.forbidden(
        'The requester is not allowed to update this pending study change'
      );
    }
    return await runTransaction(async (t) => {
      await pgHelper.updatePendingStudyChange(id, { transaction: t });
      await loggingserviceClient.createSystemLog({
        requestedBy: pendingStudyChange.requested_by,
        requestedFor: pendingStudyChange.requested_for,
        type: 'study_change',
      });
      return pendingStudyChange;
    }).catch((err) => {
      console.log(err);
      throw Boom.notFound('The pending compliance change could not be updated');
    });
  }

  /**
   * Deletes a pending study change and cancels the change request
   */
  public static async deletePendingStudyChange(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingStudyChange> {
    const pendingStudyChange = (await pgHelper
      .getPendingStudyChange(id)
      .catch((err) => {
        console.log(err);
        throw Boom.notFound('The pending compliance change could not be found');
      })) as PendingStudyChange;
    if (!decodedToken.studies.includes(pendingStudyChange.study_id)) {
      throw Boom.forbidden(
        'The requester is not allowed to delete this pending study change'
      );
    }
    return (await pgHelper.deletePendingStudyChange(id)) as PendingStudyChange;
  }

  private static createStudyChangeEmailContent(
    study_name: string,
    id: number
  ): MailContent {
    const confirmationURL =
      config.adminAppUrl +
      `/extlink/study/${study_name}/pendingstudychange?id=${id}`;
    return {
      subject: 'PIA - Sie wurden gebeten eine Studienänderung zu bestätigen',
      text:
        'Ein:e andere:r Forscher:in möchte die Daten der Studie "' +
        study_name +
        '" ändern und hat Sie als Änderungspartner ausgewählt. \n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
        '\n\n' +
        confirmationURL +
        '\n\n' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:\n' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
        '- Klicken Sie links im Menü auf "Studien" und suchen Sie in der Liste nach "' +
        study_name +
        '".\n' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.\n',
      html:
        'Ein:e andere:r Forscher:in möchte die Daten der Studie "' +
        study_name +
        '" ändern und hat Sie als Änderungspartner ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Änderung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:<br>' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
        '- Klicken Sie links im Menü auf "Studien" und suchen Sie in der Liste nach "' +
        study_name +
        '".<br>' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Änderung.<br>',
    };
  }

  private static async hasStudyAccessLevel(
    username: string,
    studyName: string,
    accessLevel: AccessLevel
  ): Promise<boolean> {
    const requestedByStudyAccess = await getRepository(StudyAccess).find({
      username,
      studyName,
    });

    return requestedByStudyAccess.some(
      (access) =>
        access.studyName === studyName && access.accessLevel === accessLevel
    );
  }
}
