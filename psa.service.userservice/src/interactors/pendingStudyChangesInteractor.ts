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
import { ProfessionalUser } from '../models/user';
import {
  PendingStudyChange,
  PendingStudyChangeRequest,
} from '../models/pendingStudyChange';
import {
  FourEyeOppositionPartnerLacksPermissionError,
  FourEyeOppositionPartnerNotFoundError,
  FourEyeOppositionPendingChangeAlreadyExistsError,
  FourEyeOppositionSelfNotAllowedAsPartnerError,
  MissingPermissionError,
  RequesterNotFound,
  StudyInvalidPsyeudonymPrefixError,
  WrongRoleError,
} from '../errors';

export class PendingStudyChangesInteractor {
  /**
   * creates the pending study change in DB if it does not exist and the requester is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param data the study change object to create
   */
  public static async createPendingStudyChange(
    decodedToken: AccessToken,
    data: PendingStudyChangeRequest
  ): Promise<PendingStudyChange> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      throw new WrongRoleError(
        'Could not create the pending deletion: Unknown or wrong role'
      );
    }

    // Check Requested By
    const requested_by = (await pgHelper.getProfessionalUser(
      userName,
      userRole
    )) as ProfessionalUser | null;
    if (!requested_by) {
      throw new RequesterNotFound('Your user does not exist as a "Forscher"');
    }
    if (
      !requested_by.study_accesses.some(
        (access) =>
          access.study_id === data.study_id && access.access_level === 'admin'
      )
    ) {
      throw new MissingPermissionError(
        'You do not have permission to change this study.'
      );
    }

    // Check Requested For
    const requested_for = (await pgHelper.getProfessionalUser(
      data.requested_for,
      userRole
    )) as ProfessionalUser | null;
    if (!requested_for) {
      throw new FourEyeOppositionPartnerNotFoundError(
        'The person to confirm does not exist as a "Forscher"'
      );
    }
    if (requested_for.username === requested_by.username) {
      throw new FourEyeOppositionSelfNotAllowedAsPartnerError(
        'You cannot request for yourself'
      );
    }
    if (
      !requested_for.study_accesses.some(
        (access) =>
          access.study_id === data.study_id && access.access_level === 'admin'
      )
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
      requested_by: userName,
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
   * updates a pending study change in DB, confirms changes and changes all data
   * @param decodedToken the decoded jwt of the request
   * @param id the id of the pending study change to update
   */
  public static async updatePendingStudyChange(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingStudyChange> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      throw Boom.forbidden(
        'Could not update the pending compliance change: Unknown or wrong role'
      );
    }
    const pendingStudyChange = (await pgHelper.getPendingStudyChange(
      id
    )) as PendingStudyChange;
    if (pendingStudyChange.requested_for !== userName) {
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
   * deletes a pending study change and cancels the change request
   * @param decodedToken the decoded jwt of the request
   * @param id the id of the study to change vaiables for
   */
  public static async deletePendingStudyChange(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingStudyChange> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    if (userRole !== 'Forscher') {
      throw Boom.forbidden(
        'Could not delete the pending compliance change: Unknown or wrong role'
      );
    }
    const pendingStudyChange = (await pgHelper
      .getPendingStudyChange(id)
      .catch((err) => {
        console.log(err);
        throw Boom.notFound('The pending compliance change could not be found');
      })) as PendingStudyChange;
    if (
      pendingStudyChange.requested_for !== userName &&
      pendingStudyChange.requested_by !== userName
    ) {
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
      config.webappUrl + `/studies?pendingStudyChangeId=${id}&type=study`;
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
}
