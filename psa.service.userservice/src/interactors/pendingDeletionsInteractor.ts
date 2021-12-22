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
import { AccessToken, MailContent, MailService } from '@pia/lib-service-core';
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
import { ProfessionalUser } from '../models/user';
import { ProbandResponse } from '../models/proband';

export async function getPendingDeletions(
  decodedToken: AccessToken,
  studyName: string,
  deletionType: PendingDeletionType
): Promise<PendingDeletionDto[]> {
  const userRole = decodedToken.role;
  const userStudies = decodedToken.groups;

  if (!userStudies.includes(studyName)) {
    throw Boom.forbidden('no access to the study');
  }
  if (deletionType === 'proband') {
    if (userRole !== 'ProbandenManager') {
      throw Boom.forbidden('wrong role');
    }
    return (await pgHelper.getPendingProbandDeletionsOfStudy(
      studyName,
      deletionType
    )) as PendingProbandDeletionDto[];
  }
  throw Boom.badImplementation('not yet implemented');
}

/**
 * gets a pending deletion from DB if user is allowed to
 * @param {object} decodedToken the decoded jwt of the request
 * @param {number} id the id of the pending deletion to get
 */
export async function getPendingDeletion(
  decodedToken: AccessToken,
  id: number
): Promise<PendingDeletionDto> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (!['ProbandenManager', 'SysAdmin'].includes(userRole)) {
    throw Boom.forbidden(
      'Could not get the pending deletion: Unknown or wrong role'
    );
  }
  const pendingDeletion = (await pgHelper.getPendingDeletion(
    id
  )) as PendingDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }

  if (
    pendingDeletion.requested_for !== userName &&
    pendingDeletion.requested_by !== userName
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to get this pending deletion'
    );
  }
  return pendingDeletion;
}

/**
 * gets a pending deletion from DB if user is allowed to
 * @param {object} decodedToken the decoded jwt of the request
 * @param {number} proband_id the id of proband for the pending deletion to get
 */
export async function getPendingDeletionForProbandId(
  decodedToken: AccessToken,
  proband_id: string
): Promise<PendingProbandDeletionDto> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (userRole !== 'ProbandenManager') {
    throw Boom.forbidden(
      'Could not get the pending deletion: Unknown or wrong role'
    );
  }
  const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
    proband_id,
    'proband'
  )) as PendingProbandDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }
  if (
    pendingDeletion.requested_for !== userName &&
    pendingDeletion.requested_by !== userName
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to get this pending deletion'
    );
  }
  return pendingDeletion;
}

/**
 * gets a pending deletion from DB if user is allowed to
 * @param {string} decodedToken the decoded jwt of the request
 * @param {number} sample_id the id of sample for the pending deletion to get
 */
export async function getPendingDeletionForSampleId(
  decodedToken: AccessToken,
  sample_id: number
): Promise<PendingSampleDeletionDto> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (userRole !== 'ProbandenManager') {
    throw Boom.forbidden(
      'Could not get the pending deletion: Unknown or wrong role'
    );
  }
  const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
    sample_id,
    'sample'
  )) as PendingSampleDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }
  if (
    pendingDeletion.requested_for !== userName &&
    pendingDeletion.requested_by !== userName
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to get this pending deletion'
    );
  }
  return pendingDeletion;
}

/**
 * gets a pending deletion from DB if user is allowed to
 * @param {string} decodedToken the decoded jwt of the request
 * @param {number} study_id the id of study for the pending deletion to get
 */
export async function getPendingDeletionForStudyId(
  decodedToken: AccessToken,
  study_id: string
): Promise<PendingStudyDeletionDto> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (userRole !== 'SysAdmin') {
    throw Boom.forbidden(
      'Could not get the pending deletion: Unknown or wrong role'
    );
  }
  const pendingDeletion = (await pgHelper.getPendingDeletionByForIdAndType(
    study_id,
    'study'
  )) as PendingStudyDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }

  if (
    pendingDeletion.requested_for !== userName &&
    pendingDeletion.requested_by !== userName
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to get this pending deletion'
    );
  }
  return pendingDeletion;
}

function createProbandDeletionEmailContent(id: string): MailContent {
  const confirmationURL =
    config.webappUrl +
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

function createStudyDeletionEmailContent(id: number): MailContent {
  const confirmationURL =
    config.webappUrl + `/studies?pendingDeletionId=${id}&type=study`;
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

function createSampleDeletionEmailContent(
  pseudonym: string,
  id: number
): MailContent {
  const confirmationURL =
    config.webappUrl +
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

async function createPendingProbandDeletion(
  data: PendingDeletionRequest,
  requestedByStudies: string[],
  requestedForStudies: string[]
): Promise<PendingProbandDeletionDto> {
  const proband = await checkAccessOnProband(
    data.for_id,
    requestedByStudies,
    requestedForStudies
  );

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

    const fastDeletion: PendingProbandDeletionDto = {
      ...data,
      id: 0,
      type: 'proband',
    };
    await executePendingDeletion(fastDeletion);
    return fastDeletion;
  }

  if (data.requested_by === data.requested_for) {
    throw Boom.badData('You cannot request for yourself');
  }

  const pendingDeletion = (await pgHelper.createPendingDeletion(
    data
  )) as PendingProbandDeletionDto;

  await notifyRequestedForOrCancleDeletion(
    data.requested_for,
    createProbandDeletionEmailContent(data.for_id),
    pendingDeletion.id
  );

  return pendingDeletion;
}

async function createPendingSampleDeletion(
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

  await checkAccessOnProband(
    pseudonym,
    requestedByStudies,
    requestedForStudies
  );

  const pendingDeletion = (await pgHelper.createPendingDeletion(
    data
  )) as PendingSampleDeletionDto;

  await notifyRequestedForOrCancleDeletion(
    data.requested_for,
    createSampleDeletionEmailContent(pseudonym, pendingDeletion.id),
    pendingDeletion.id
  );

  return pendingDeletion;
}

async function createPendingStudyDeletion(
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

  await notifyRequestedForOrCancleDeletion(
    data.requested_for,
    createStudyDeletionEmailContent(pendingDeletion.id),
    pendingDeletion.id
  );

  return pendingDeletion;
}

async function notifyRequestedForOrCancleDeletion(
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

async function checkAccessOnProband(
  pseudonym: string,
  requestedByStudies: string[],
  requestedForStudies: string[]
): Promise<ProbandResponse> {
  let proband: ProbandResponse | void;
  try {
    proband = await ProbandsRepository.getProbandAsProfessional(
      pseudonym,
      requestedByStudies
    );
  } catch (err) {
    console.log(err);
    throw Boom.badData('Proband not found');
  }

  if (!requestedForStudies.includes(proband.study)) {
    throw Boom.forbidden('requested_for user is not in the probands study');
  }
  return proband;
}

/**
 * creates the pending deletion in DB if it does not exist and the requester is allowed to
 * @param {string} decodedToken the decoded jwt of the request
 * @param {object} data the user object to create
 */
export async function createPendingDeletion(
  decodedToken: AccessToken,
  data: PendingDeletionRequest
): Promise<PendingDeletionDto> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;
  const userStudies = decodedToken.groups;

  if (!['ProbandenManager', 'SysAdmin'].includes(userRole)) {
    throw Boom.forbidden(
      'Could not create the pending deletion: Unknown or wrong role'
    );
  }
  data.requested_by = userName;

  // Check requested_for
  const requestedForUser = (await pgHelper.getProfessionalUser(
    data.requested_for,
    userRole
  )) as ProfessionalUser | null;
  if (!requestedForUser) {
    throw Boom.badData('Could not find the requested_for user');
  }
  const requestedForStudies = requestedForUser.study_accesses.map(
    (access) => access.study_id
  );

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
    return await createPendingProbandDeletion(
      data,
      userStudies,
      requestedForStudies
    );
  } else if (data.type === 'sample' && userRole === 'ProbandenManager') {
    return await createPendingSampleDeletion(
      data,
      userStudies,
      requestedForStudies
    );
  } else if (data.type === 'study' && userRole === 'SysAdmin') {
    return await createPendingStudyDeletion(data);
  }
  throw Boom.forbidden('Could not create the pending deletion: wrong role');
}

async function executePendingDeletion(
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
        for (const proband of studyProbands) {
          await personaldataserviceClient.deletePersonalDataOfUser(proband);
        }
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

/**
 * updates a pending deletion in DB, confirms deletion and delets all data
 * @param {string} decodedToken the decoded jwt of the request
 * @param {number} id the id of the pending deletion to update
 */
export async function updatePendingDeletion(
  decodedToken: AccessToken,
  id: number
): Promise<void> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (userRole !== 'ProbandenManager' && userRole !== 'SysAdmin') {
    throw Boom.forbidden('Unknown or wrong role');
  }

  // Get
  const pendingDeletion = (await pgHelper.getPendingDeletion(
    id
  )) as PendingDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }

  // Check
  if (
    pendingDeletion.requested_for !== userName ||
    (pendingDeletion.type === 'study' && userRole !== 'SysAdmin') ||
    (pendingDeletion.type === 'sample' && userRole !== 'ProbandenManager') ||
    (pendingDeletion.type === 'proband' && userRole !== 'ProbandenManager')
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to update this pending deletion'
    );
  }

  // Execute
  await executePendingDeletion(id);
}

/**
 * deletes a pending deletion and cancels the deletion request
 * @param {string} decodedToken the decoded jwt of the request
 * @param {number} id the id of the user to delete
 */
export async function cancelPendingDeletion(
  decodedToken: AccessToken,
  id: number
): Promise<void> {
  const userRole = decodedToken.role;
  const userName = decodedToken.username;

  if (!(userRole === 'ProbandenManager' || userRole === 'SysAdmin')) {
    throw Boom.forbidden(
      'Could not delete the pending deletion: Unknown or wrong role'
    );
  }

  // Get
  const pendingDeletion = (await pgHelper.getPendingDeletion(
    id
  )) as PendingDeletionDto | null;
  if (!pendingDeletion) {
    throw Boom.notFound('The pending deletion was not found');
  }

  // Check
  if (
    (pendingDeletion.requested_for !== userName &&
      pendingDeletion.requested_by !== userName) ||
    (pendingDeletion.type === 'study' && userRole !== 'SysAdmin') ||
    (pendingDeletion.type === 'sample' && userRole !== 'ProbandenManager') ||
    (pendingDeletion.type === 'proband' && userRole !== 'ProbandenManager')
  ) {
    throw Boom.forbidden(
      'The requester is not allowed to delete this pending deletion'
    );
  }

  // Delete
  await pgHelper.cancelPendingDeletion(id);
}
