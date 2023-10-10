/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import pgHelper from '../services/postgresqlHelper';
import { ProbandService } from '../services/probandService';
import { loggingserviceClient } from '../clients/loggingserviceClient';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { runTransaction } from '../db';
import {
  AccessToken,
  getPrimaryRealmRole,
  MailContent,
  MailService,
} from '@pia/lib-service-core';
import { config } from '../config';
import { ProbandsRepository } from '../repositories/probandsRepository';
import {
  PendingDeletionDto,
  PendingDeletionRequest,
  PendingDeletionType,
  PendingProbandDeletionDto,
  PendingSampleDeletionDto,
  PendingStudyDeletionDto,
} from '../models/pendingDeletion';
import { Study } from '../models/study';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { ProfessionalAccount } from '../models/account';
import { AccountNotFound } from '../errors';
import { ProbandAccountService } from '../services/probandAccountService';
import { ProfessionalRole } from '../models/role';
import { getArrayIntersection } from '../helpers/arrayIntersection';
import { messageQueueService } from '../services/messageQueueService';

export class PendingDeletionsInteractor {
  /**
   * Gets a pending deletion from DB if user is allowed to
   */
  public static async getPendingDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingDeletionDto> {
    const pendingDeletion = (await pgHelper.getPendingDeletion(
      id
    )) as PendingDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);
    this.assertPendingDeletionRequestIsAllowed(pendingDeletion, decodedToken);

    return pendingDeletion;
  }

  /**
   * gets a pending deletion from DB if user is allowed to
   */
  public static async getPendingDeletionForProbandId(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PendingProbandDeletionDto> {
    const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
      pseudonym,
      'proband'
    )) as PendingProbandDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);
    this.assertPendingDeletionRequestIsAllowed(pendingDeletion, decodedToken);

    return pendingDeletion;
  }

  /**
   * Gets a pending deletion from DB if user is allowed to
   */
  public static async getPendingDeletionForSampleId(
    decodedToken: AccessToken,
    sampleId: string
  ): Promise<PendingSampleDeletionDto> {
    const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
      sampleId,
      'sample'
    )) as PendingSampleDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);
    this.assertPendingDeletionRequestIsAllowed(pendingDeletion, decodedToken);

    return pendingDeletion;
  }

  /**
   * Gets a pending deletion from DB if user is allowed to
   */
  public static async getPendingDeletionForStudy(
    decodedToken: AccessToken,
    studyName: string
  ): Promise<PendingStudyDeletionDto> {
    const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
      studyName,
      'study'
    )) as PendingStudyDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);
    this.assertPendingDeletionRequestIsAllowed(pendingDeletion, decodedToken);

    return pendingDeletion;
  }

  public static async getPendingDeletions(
    studyName: string,
    deletionType: PendingDeletionType
  ): Promise<PendingDeletionDto[]> {
    if (deletionType !== 'proband') {
      throw Boom.badImplementation('not yet implemented');
    }
    return (await pgHelper.getPendingProbandDeletionsOfStudy(
      studyName,
      deletionType
    )) as PendingProbandDeletionDto[];
  }

  /**
   * Creates the pending deletion in DB if it does not exist and the requester is allowed to
   */
  public static async createPendingDeletion(
    decodedToken: AccessToken,
    data: PendingDeletionRequest
  ): Promise<PendingDeletionDto> {
    const userRole = getPrimaryRealmRole(decodedToken);

    data.requested_by = decodedToken.username;

    let requestedForUser: ProfessionalAccount;
    try {
      requestedForUser =
        await ProfessionalAccountService.getProfessionalAccount(
          data.requested_for
        );
    } catch (err) {
      if (err instanceof AccountNotFound) {
        throw Boom.badData('Could not find the requested_for user');
      }
      throw err;
    }

    if (userRole !== requestedForUser.role) {
      throw Boom.forbidden('requested_for user has the wrong role');
    }

    // check if pending deletion already exists
    const existingPendingDeletion =
      (await pgHelper.getPendingDeletionByForIdAndType(
        data.for_id,
        data.type
      )) as PendingStudyDeletionDto | null;
    if (existingPendingDeletion) {
      throw Boom.forbidden('Deletion already requested');
    }

    if (data.type === 'proband' && userRole === 'ProbandenManager') {
      return await this.createPendingProbandDeletion(
        data,
        decodedToken.studies,
        requestedForUser.studies
      );
    } else if (data.type === 'sample' && userRole === 'ProbandenManager') {
      return await this.createPendingSampleDeletion(
        data,
        decodedToken.studies,
        requestedForUser.studies
      );
    } else if (data.type === 'study' && userRole === 'SysAdmin') {
      return await this.createPendingStudyDeletion(data);
    }
    throw Boom.forbidden('Could not create the pending deletion: wrong role');
  }

  /**
   * Updates a pending deletion in DB, confirms deletion and delets all data
   */
  public static async updatePendingDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<void> {
    const userRole = getPrimaryRealmRole(decodedToken);

    // Get
    const pendingDeletion = (await pgHelper.getPendingDeletion(
      id
    )) as PendingDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);

    // Check
    if (
      pendingDeletion.requested_for !== decodedToken.username ||
      (pendingDeletion.type === 'study' && userRole !== 'SysAdmin') ||
      (pendingDeletion.type === 'sample' && userRole !== 'ProbandenManager') ||
      (pendingDeletion.type === 'proband' && userRole !== 'ProbandenManager')
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to update this pending deletion'
      );
    }

    // Execute
    await this.executePendingDeletion(id);
  }

  /**
   * Deletes a pending deletion and cancels the deletion request
   */
  public static async cancelPendingDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<void> {
    const userRole = getPrimaryRealmRole(decodedToken);

    if (!(userRole === 'ProbandenManager' || userRole === 'SysAdmin')) {
      throw Boom.forbidden(
        'Could not delete the pending deletion: Unknown or wrong role'
      );
    }

    // Get
    const pendingDeletion = (await pgHelper.getPendingDeletion(
      id
    )) as PendingDeletionDto | null;

    this.assertPendingDeletionIsDefined(pendingDeletion);

    // Check
    if (
      !(await this.isUserAllowedToCancel(
        decodedToken.username,
        userRole,
        decodedToken.studies,
        pendingDeletion
      ))
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to delete this pending deletion'
      );
    }

    // Delete
    await pgHelper.cancelPendingDeletion(id);
  }

  private static assertPendingDeletionIsDefined(
    pendingDeletion: PendingDeletionDto | null
  ): asserts pendingDeletion is NonNullable<PendingDeletionDto> {
    if (!pendingDeletion) {
      throw Boom.notFound('The pending deletion was not found');
    }
  }

  private static assertPendingDeletionRequestIsAllowed(
    pendingDeletion: PendingDeletionDto,
    decodedToken: AccessToken
  ): void {
    if (
      pendingDeletion.requested_for !== decodedToken.username &&
      pendingDeletion.requested_by !== decodedToken.username
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to get this pending deletion'
      );
    }
  }

  private static async createPendingProbandDeletion(
    data: PendingDeletionRequest,
    requestedByStudies: string[],
    requestedForStudies: string[]
  ): Promise<PendingProbandDeletionDto> {
    let proband;
    try {
      proband = await ProbandService.getProbandByPseudonymOrFail(
        data.for_id,
        getArrayIntersection(requestedByStudies, requestedForStudies)
      );
    } catch (err) {
      console.log(err);
      throw Boom.notFound('Proband not found');
    }

    const studyOfProband = (await pgHelper.getStudy(proband.study)) as Study;

    if (!studyOfProband.has_total_opposition) {
      throw Boom.forbidden('This operation cannot be done for this study');
    }

    if (!studyOfProband.has_four_eyes_opposition) {
      // No 4 eye deletion in study, delete instantly
      if (data.requested_by !== data.requested_for) {
        throw Boom.badData(
          'You cannot delete a proband saying it was someone else'
        );
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const fastDeletion: PendingProbandDeletionDto = {
        ...data,
        id: 0,
        type: 'proband',
      } as PendingProbandDeletionDto;
      await this.executePendingDeletion(fastDeletion);
      return fastDeletion;
    }

    if (data.requested_by === data.requested_for) {
      throw Boom.badData('You cannot request for yourself');
    }

    const pendingDeletion = (await pgHelper.createPendingDeletion(
      data
    )) as PendingProbandDeletionDto;

    await this.notifyRequestedForOrCancleDeletion(
      data.requested_for,
      this.createProbandDeletionEmailContent(data.for_id),
      pendingDeletion.id
    );

    return pendingDeletion;
  }

  private static async createPendingSampleDeletion(
    data: PendingDeletionRequest,
    requestedByStudies: string[],
    requestedForStudies: string[]
  ): Promise<PendingSampleDeletionDto> {
    if (data.requested_by === data.requested_for) {
      throw Boom.badData('You cannot request for yourself');
    }
    let pseudonym: string;
    try {
      pseudonym = (await pgHelper.getUserOfLabResult(data.for_id)) as string;
    } catch (err) {
      console.log(err);
      throw Boom.badData('Lab result not found');
    }

    try {
      await ProbandService.assertProbandExistsWithStudyAccess(
        pseudonym,
        getArrayIntersection(requestedByStudies, requestedForStudies)
      );
    } catch (err) {
      throw Boom.notFound('Could not find proband of lab result');
    }

    const pendingDeletion = (await pgHelper.createPendingDeletion(
      data
    )) as PendingSampleDeletionDto;

    await this.notifyRequestedForOrCancleDeletion(
      data.requested_for,
      this.createSampleDeletionEmailContent(pseudonym, pendingDeletion.id),
      pendingDeletion.id
    );

    return pendingDeletion;
  }

  private static async createPendingStudyDeletion(
    data: PendingDeletionRequest
  ): Promise<PendingStudyDeletionDto> {
    if (data.requested_by === data.requested_for) {
      throw Boom.badData('You cannot request for yourself');
    }
    const study = (await pgHelper.getStudy(data.for_id)) as Study | null;
    if (!study) {
      throw Boom.forbidden('Study not found');
    }

    const pendingDeletion = (await pgHelper.createPendingDeletion(
      data
    )) as PendingStudyDeletionDto;

    await this.notifyRequestedForOrCancleDeletion(
      data.requested_for,
      this.createStudyDeletionEmailContent(pendingDeletion.id),
      pendingDeletion.id
    );

    return pendingDeletion;
  }

  private static async notifyRequestedForOrCancleDeletion(
    requestedFor: string,
    mailContent: MailContent,
    pendingDeletionId: number
  ): Promise<void> {
    let result: boolean;
    try {
      result = await MailService.sendMail(requestedFor, mailContent);
    } catch (err) {
      await pgHelper.cancelPendingDeletion(pendingDeletionId);
      console.log(err);
      throw Boom.serverUnavailable(
        'requested_for could not be reached via email'
      );
    }
    if (!result) {
      throw Boom.badData('requested_for could not be reached via email');
    }
  }

  private static async executePendingDeletion(
    toExecute: PendingDeletionDto | number
  ): Promise<void> {
    return await runTransaction(async (t) => {
      const pendingDeletionFromDb = typeof toExecute === 'number';
      const pendingDeletion = pendingDeletionFromDb
        ? ((await pgHelper.getPendingDeletion(
            toExecute
          )) as PendingDeletionDto | null)
        : toExecute;
      if (!pendingDeletion) {
        throw Boom.notFound('The pending deletion was not found');
      }
      switch (pendingDeletion.type) {
        case 'proband':
          await ProbandService.delete(pendingDeletion.for_id, 'default', {
            transaction: t,
          });
          break;
        case 'sample':
          await pgHelper.deleteSampleData(pendingDeletion.for_id, {
            transaction: t,
          });
          break;
        case 'study': {
          const studyProbands = await ProbandsRepository.getPseudonyms(
            pendingDeletion.for_id,
            undefined,
            undefined,
            {
              transaction: t,
            }
          );
          await pgHelper.deleteStudyData(pendingDeletion.for_id, {
            transaction: t,
          });
          for (const pseudonym of studyProbands) {
            await ProbandAccountService.deleteProbandAccount(pseudonym, false);

            await personaldataserviceClient.deletePersonalDataOfUser(pseudonym);
          }
          await ProfessionalAccountService.deleteStudy(pendingDeletion.for_id);
          await ProbandAccountService.deleteStudy(pendingDeletion.for_id);

          await messageQueueService.sendStudyDeleted(pendingDeletion.for_id);
          break;
        }
      }
      await loggingserviceClient.createSystemLog({
        requestedBy: pendingDeletion.requested_by,
        requestedFor: pendingDeletion.requested_for,
        type: pendingDeletion.type,
      });
      if (pendingDeletionFromDb) {
        await pgHelper.deletePendingDeletion(toExecute, { transaction: t });
      }
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err as Error);
    });
  }

  private static async isUserAllowedToCancel(
    username: string,
    role: ProfessionalRole,
    studies: string[],
    pendingDeletion: PendingDeletionDto
  ): Promise<boolean> {
    switch (pendingDeletion.type) {
      case 'proband': {
        if (role !== 'ProbandenManager') {
          return false;
        }
        try {
          await ProbandService.assertProbandExistsWithStudyAccess(
            pendingDeletion.for_id,
            studies
          );
          return true;
        } catch (err) {
          throw Boom.notFound('Could not find proband to delete');
        }
      }
      case 'sample': {
        return (
          role === 'ProbandenManager' &&
          (pendingDeletion.requested_for === username ||
            pendingDeletion.requested_by === username)
        );
      }
      case 'study': {
        return (
          role === 'SysAdmin' &&
          (pendingDeletion.requested_for === username ||
            pendingDeletion.requested_by === username)
        );
      }
    }
  }

  private static createProbandDeletionEmailContent(id: string): MailContent {
    const confirmationURL =
      config.adminAppUrl +
      `/probands-personal-info?probandIdToDelete=${id}&type=general`;
    return {
      subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
      text:
        'Ein:e andere:r Probandenmanager:in möchte den "vollständigen Widerspruch" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:\n' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.\n' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.\n',
      html:
        'Ein:e andere:r Probandenmanager:in möchte den "vollständigen Widerspruch" eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:<br>' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
        '- Klicken Sie links im Menü auf "Teilnehmende" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.<br>' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.<br>',
    };
  }

  private static createStudyDeletionEmailContent(id: number): MailContent {
    const confirmationURL =
      config.adminAppUrl + `/studies?pendingDeletionId=${id}&type=study`;
    return {
      subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
      text:
        'Ein:e andere:r Systemadministrator:in möchte die vollständige Löschung einer Studie durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n',
      html:
        'Ein:e andere:r Systemadministrator:in möchte die vollständige Löschung einer Studie durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>',
    };
  }

  private static createSampleDeletionEmailContent(
    pseudonym: string,
    id: number
  ): MailContent {
    const confirmationURL =
      config.adminAppUrl +
      `/sample-management/${pseudonym}?pendingDeletionId=${id}`;
    return {
      subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
      text:
        'Ein:e andere:r Probandenmanager:in möchte die Löschung einer Probe eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:\n' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.\n' +
        '- Klicken Sie links im Menü auf "Probenverwaltung" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.\n' +
        '- Klicken Sie bei diesem Teilnehmenden auf "Details" (Auge) und suchen Sie in der Liste nach der Probe mit der ID, die der:die Löschpartner:in Ihnen telefonisch übergeben kann.\n' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.\n',
      html:
        'Ein:e andere:r Probandenmanager:in möchte die Löschung einer Probe eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>' +
        'Sollte Ihnen dies nicht möglich sein (weil sie PIA beispielsweise nur über den Thin-Client nutzen können), ' +
        'gehen Sie bitte wie folgt vor:<br>' +
        '- Öffnen Sie PIA über Ihren üblichen Weg und melden sich an.<br>' +
        '- Klicken Sie links im Menü auf "Probenverwaltung" und suchen Sie in der Liste nach dem Pseudonym, das Ihnen der:die Löschpartner:in telefonisch übergeben kann.<br>' +
        '- Klicken Sie bei diesem Teilnehmenden auf "Details" (Auge) und suchen Sie in der Liste nach der Probe mit der ID, die der:die Löschpartner:in Ihnen telefonisch übergeben kann.<br>' +
        '- Klicken Sie auf den Bestätigungsknopf rechts und bestätigen Sie die Löschung.<br>',
    };
  }
}
