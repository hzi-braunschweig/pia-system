/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { PendingDeletionRepository } from '../repositories/pendingDeletionRepository';
import { PendingDeletionService } from '../services/pendingDeletionService';

import { userserviceClient } from '../clients/userserviceClient';

import { AccessToken, assertStudyAccess } from '@pia/lib-service-core';
import {
  PendingDeletionDb,
  PendingDeletionReq,
  PendingDeletionRes,
} from '../models/pendingDeletion';

export class PendingDeletionsInteractor {
  /**
   * Gets pending deletions from DB
   */
  public static async getPendingDeletions(
    studyName: string
  ): Promise<PendingDeletionDb[]> {
    return await PendingDeletionRepository.getPendingDeletionsOfStudy(
      studyName
    );
  }

  /**
   * Gets a pending deletion from DB if user is allowed to
   */
  public static async getPendingDeletion(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PendingDeletionDb> {
    const pendingDeletion = await PendingDeletionRepository.getPendingDeletion(
      pseudonym
    ).catch((err) => {
      console.error(err);
      throw Boom.notFound('The pending deletion was not found');
    });
    assertStudyAccess(pendingDeletion.study, decodedToken);
    if (
      pendingDeletion.requested_for !== decodedToken.username &&
      pendingDeletion.requested_by !== decodedToken.username
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to access this pending deletion'
      );
    }
    return pendingDeletion;
  }

  /**
   * Creates the pending deletion in DB if it does not exist and the requester is allowed to
   */
  public static async createPendingDeletion(
    decodedToken: AccessToken,
    deletion: PendingDeletionReq
  ): Promise<PendingDeletionRes> {
    const studyName = await userserviceClient.getStudyOfProband(
      deletion.proband_id
    );
    if (!studyName) {
      throw Boom.notFound('Could not find study of proband');
    }
    assertStudyAccess(studyName, decodedToken);

    deletion.requested_by = decodedToken.username;
    const probandsOfRequestedFor =
      await userserviceClient.getProbandsWithAccessToFromProfessional(
        deletion.requested_for
      );

    if (!probandsOfRequestedFor.includes(deletion.proband_id)) {
      throw Boom.notFound(
        'Proband, requested_by and requested_for are not in the same study.'
      );
    }

    const affectedStudy = await userserviceClient.getStudy(studyName);
    if (
      !affectedStudy ||
      !(
        affectedStudy.has_total_opposition ||
        affectedStudy.has_partial_opposition
      )
    ) {
      throw Boom.forbidden('This operation is not allowed for this study');
    }

    if (affectedStudy.has_four_eyes_opposition) {
      if (deletion.requested_for === deletion.requested_by) {
        throw Boom.badData(
          'You cannot request a deletion to be confirmed by yourself.'
        );
      }
      return PendingDeletionService.createPendingDeletion(deletion);
    } else {
      if (deletion.requested_for !== deletion.requested_by) {
        throw Boom.badData(
          'You cannot delete and say it was confirmed by someone else.'
        );
      }
      await PendingDeletionService.executeDeletion(deletion);
      return {
        study: studyName,
        ...deletion,
      };
    }
  }

  /**
   * Confirms a pending deletion and deletes all data
   */
  public static async executePendingDeletion(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PendingDeletionRes> {
    const pendingDeletion = await PendingDeletionRepository.getPendingDeletion(
      pseudonym
    ).catch((err) => {
      console.error(err);
      throw Boom.notFound('The pending deletion was not found');
    });

    assertStudyAccess(pendingDeletion.study, decodedToken);

    if (pendingDeletion.requested_for !== decodedToken.username) {
      throw Boom.forbidden(
        'The requester is not allowed to execute this pending deletion'
      );
    }

    // execute deletion
    await PendingDeletionService.executeDeletion(pendingDeletion);
    return pendingDeletion;
  }

  /**
   * Deletes a pending deletion and cancels the deletion request
   */
  public static async deletePendingDeletion(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<void> {
    const pendingDeletion = await PendingDeletionRepository.getPendingDeletion(
      pseudonym
    ).catch((err) => {
      console.error(err);
      throw Boom.notFound('The pending deletion was not found');
    });

    assertStudyAccess(pendingDeletion.study, decodedToken);

    if (!decodedToken.studies.includes(pendingDeletion.study)) {
      throw Boom.forbidden(
        'The requester is not allowed to delete this pending deletion'
      );
    }
    await PendingDeletionService.deletePendingDeletion(pseudonym);
  }
}
