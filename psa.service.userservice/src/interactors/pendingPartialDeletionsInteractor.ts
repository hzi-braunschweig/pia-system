/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import validator from 'email-validator';

import { AccessToken, MailService } from '@pia/lib-service-core';

import { PendingPartialDeletionMapper } from '../services/pendingPartialDeletionMapper';
import { config } from '../config';
import pgHelper from '../services/postgresqlHelper';
import { PendingPartialDeletionRepository } from '../repositories/pendingPartialDeletionRepository';
import { loggingserviceClient } from '../clients/loggingserviceClient';
import { runTransaction } from '../db';
import {
  PendingPartialDeletionReq,
  PendingPartialDeletionRes,
} from '../models/pendingPartialDeletion';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { ProfessionalAccount } from '../models/account';
import { AccountNotFound } from '../errors';
import { ProbandService } from '../services/probandService';
import { getArrayIntersection } from '../helpers/arrayIntersection';

/**
 * Interactor that handles pending deletion requests based on users permissions
 */
export class PendingPartialDeletionsInteractor {
  /**
   * Gets a pending partial deletion from DB if user is allowed to
   */
  public static async getPendingPartialDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingPartialDeletionRes> {
    const pendingPartialDeletion =
      await PendingPartialDeletionRepository.getPendingPartialDeletion(
        id
      ).catch((err) => {
        console.log(err);
        throw Boom.notFound('The pending deletion was not found');
      });

    if (
      pendingPartialDeletion.requested_for !== decodedToken.username &&
      pendingPartialDeletion.requested_by !== decodedToken.username
    ) {
      throw Boom.forbidden(
        'The requester is not allowed to get this pending deletion'
      );
    }

    return PendingPartialDeletionMapper.mapDbPendingPartialDeletion(
      pendingPartialDeletion
    );
  }

  /**
   * Creates the pending partial deletion in DB if it does not exist and the requester is allowed to
   */
  public static async createPendingPartialDeletion(
    decodedToken: AccessToken,
    data: PendingPartialDeletionReq
  ): Promise<PendingPartialDeletionRes> {
    if (data.requestedFor === decodedToken.username) {
      throw Boom.badData(
        'The requester and the one who should confirm cannot be the same user'
      );
    }
    if (!validator.validate(data.requestedFor)) {
      throw Boom.badData(
        'The username of the one who should confirm is not an email'
      );
    }

    let requestedFor: ProfessionalAccount;
    try {
      requestedFor = await ProfessionalAccountService.getProfessionalAccount(
        data.requestedFor
      );
    } catch (err) {
      if (err instanceof AccountNotFound) {
        throw Boom.badData('The one who should confirm could not be found');
      }
      throw err;
    }
    if (requestedFor.role !== 'Forscher') {
      throw Boom.badData('The one who should confirm has the wrong role');
    }

    try {
      await ProbandService.assertProbandExistsWithStudyAccess(
        data.probandId,
        getArrayIntersection(decodedToken.studies, requestedFor.studies)
      );
    } catch (err) {
      throw Boom.notFound('Could not find proband to delete');
    }

    return await runTransaction(async (transaction) => {
      if (
        !(await pgHelper.areInstanceIdsFromUser(
          data.probandId,
          data.forInstanceIds,
          {
            transaction,
          }
        )) ||
        !(await pgHelper.areSampleIdsFromUser(
          data.probandId,
          data.forLabResultsIds,
          {
            transaction,
          }
        ))
      ) {
        throw Boom.forbidden('Not all data belong to the submitted proband.');
      }

      const pendingPartialDeletion =
        await PendingPartialDeletionRepository.createPendingPartialDeletion(
          PendingPartialDeletionMapper.mapReqPendingPartialDeletion(
            decodedToken.username,
            data
          ),
          { transaction }
        );
      const result = await this.sendPartialDeletionEmail(
        data.requestedFor,
        pendingPartialDeletion.id
      );
      if (!result) {
        throw Boom.badData('Forscher could not be reached via email.');
      }
      return PendingPartialDeletionMapper.mapDbPendingPartialDeletion(
        pendingPartialDeletion
      );
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err as Error);
    });
  }

  /**
   * Updates a pending partial deletion in DB, confirms deletion and delets all data
   */
  public static async updatePendingPartialDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<PendingPartialDeletionRes> {
    return await runTransaction(async (transaction) => {
      const pendingPartialDeletion =
        await PendingPartialDeletionRepository.getPendingPartialDeletion(id, {
          transaction,
        }).catch((err) => {
          console.log(err);
          throw Boom.notFound((err as Error).toString());
        });

      if (pendingPartialDeletion.requested_for !== decodedToken.username) {
        throw Boom.forbidden(
          'The requester is not allowed to update this pending deletion'
        );
      }

      const executedPendingPartialDeletion =
        await PendingPartialDeletionRepository.executePendingPartialDeletion(
          id,
          { transaction }
        );

      await loggingserviceClient.createSystemLog({
        requestedBy: executedPendingPartialDeletion.requested_by,
        requestedFor: executedPendingPartialDeletion.requested_for,
        type: 'partial',
      });

      return PendingPartialDeletionMapper.mapDbPendingPartialDeletion(
        executedPendingPartialDeletion
      );
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err as Error);
    });
  }

  /**
   * Deletes a pending partial deletion and cancels the deletion request
   */
  public static async deletePendingPartialDeletion(
    decodedToken: AccessToken,
    id: number
  ): Promise<null> {
    return await runTransaction(async (transaction) => {
      const pendingPartialDeletion =
        await PendingPartialDeletionRepository.getPendingPartialDeletion(id, {
          transaction,
        }).catch((err) => {
          console.log(err);
          throw Boom.notFound('The pending partial deletion was not found');
        });
      if (
        pendingPartialDeletion.requested_for !== decodedToken.username &&
        pendingPartialDeletion.requested_by !== decodedToken.username
      ) {
        throw Boom.forbidden(
          'The requester is not allowed to delete this pending deletion'
        );
      }
      await PendingPartialDeletionRepository.deletePendingPartialDeletion(id, {
        transaction,
      });
      return null;
    }).catch((err) => {
      console.log(err);
      throw Boom.boomify(err as Error);
    });
  }

  /**
   * Sends a request email to the one, who should confirm this partial deletion
   */
  private static async sendPartialDeletionEmail(
    mailAddress: string,
    id: number
  ): Promise<boolean> {
    const confirmationURL =
      config.webappUrl + `/admin/probands?pendingPartialDeletionId=${id}`;
    const content = {
      subject: 'PIA - Sie wurden gebeten eine Löschung zu bestätigen',
      text:
        'Ein:e andere:r Forscher:in möchte den teilweisen Widerspruch eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.\n\n' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '\n\n' +
        confirmationURL +
        '\n\n',
      html:
        'Ein:e andere:r Forscher:in möchte den teilweisen Widerspruch eines Teilnehmenden durchführen und hat Sie als Löschpartner:in ausgewählt.<br><br>' +
        'Bitte öffnen Sie den folgenden Link in Ihrem Browser und bestätigen Sie die Löschung:' +
        '<br><br><a href="' +
        confirmationURL +
        '">' +
        confirmationURL +
        '</a><br><br>',
    };
    return MailService.sendMail(mailAddress, content).catch((err) => {
      console.error(err);
      throw Boom.badData('Forscher could not be reached via email.');
    });
  }
}
