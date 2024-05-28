/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import {
  CreateProbandRequest,
  CreateProbandResponse,
  isProbandComplianceContactPatch,
  isProbandStatusPatch,
  ProbandComplianceContactPatch,
  ProbandDto,
  ProbandExternalIdResponse,
  ProbandStatusPatch,
} from '../../models/proband';
import { ExternalCompliance } from '../../models/externalCompliance';
import { messageQueueService } from '../../services/messageQueueService';
import {
  ProbandDeletionType,
  ProbandService,
} from '../../services/probandService';
import {
  AccountCreateError,
  CouldNotCreateNewRandomPseudonymError,
  IdsAlreadyExistsError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../../errors';
import { getRepository, IsNull, Not } from 'typeorm';
import { Proband } from '../../entities/proband';
import { ProbandStatus } from '../../models/probandStatus';
import { ProbandsRepository } from '../../repositories/probandsRepository';
import { StudyAccess } from '../../entities/studyAccess';

/**
 * Internal interactor that handles proband requests
 */
export class InternalProbandsInteractor {
  public static async createProband(
    studyName: string,
    probandRequest: CreateProbandRequest
  ): Promise<CreateProbandResponse> {
    try {
      return await ProbandService.createProbandWithAccount(
        studyName,
        probandRequest,
        false,
        probandRequest.temporaryPassword ?? true
      );
    } catch (e) {
      if (e instanceof StudyNotFoundError) {
        throw Boom.preconditionRequired('study not found');
      } else if (e instanceof PseudonymAlreadyExistsError) {
        throw Boom.conflict('proband with same pseudonym already exists');
      } else if (e instanceof IdsAlreadyExistsError) {
        throw Boom.conflict('proband with same ids already exists');
      } else if (e instanceof AccountCreateError) {
        console.error(e);
        throw Boom.badImplementation(
          'a problem occurred while creating the account'
        );
      } else if (e instanceof ProbandSaveError) {
        console.error(e);
        throw Boom.badImplementation(
          'a problem occurred while saving the proband'
        );
      } else if (e instanceof CouldNotCreateNewRandomPseudonymError) {
        console.error(e);
        throw Boom.conflict(
          'unable to create a random, not yet assigned pseudonym'
        );
      } else {
        console.error(e);
        throw Boom.badImplementation('an unknown error occurred');
      }
    }
  }

  /**
   * Deletes a proband and all its data from DB
   * @param {string} pseudonym the pseudonym of the proband to delete
   * @param {boolean} keepUsageData Will not delete questionnaire answers which are marked to keep its answers and log data if true
   * @param {boolean} isFullDeletion If a proband was created mistakenly, a full deletion can be done. keepUsageData will then be ignored.
   */
  public static async deleteProbandData(
    pseudonym: string,
    keepUsageData: boolean,
    isFullDeletion: boolean
  ): Promise<null> {
    try {
      let deletionType: ProbandDeletionType;
      if (isFullDeletion) {
        deletionType = 'full';
      } else if (keepUsageData) {
        deletionType = 'keep_usage_data';
      } else {
        deletionType = 'default';
      }

      await ProbandService.delete(pseudonym, deletionType);
      return null;
    } catch (err) {
      console.log(err);
      throw Boom.boomify(err as Error);
    }
  }

  /**
   * Gets the proband by pseudonym
   */
  public static async getProband(pseudonym: string): Promise<ProbandDto> {
    try {
      return await ProbandService.getProbandByPseudonymOrFail(pseudonym);
    } catch (err) {
      throw Boom.notFound(
        'The proband with the given pseudonym does not exist'
      );
    }
  }

  public static async getProbandByIDS(ids: string): Promise<ProbandDto> {
    try {
      return await ProbandService.getProbandByIdsOrFail(ids);
    } catch (err) {
      throw Boom.notFound('The proband with the given ids does not exist');
    }
  }

  /**
   * Gets the proband's IDS from DB
   */
  public static async lookupIds(pseudonym: string): Promise<string | null> {
    try {
      return (await ProbandService.getProbandByPseudonymOrFail(pseudonym)).ids;
    } catch (err) {
      throw Boom.notFound(
        'The proband with the given pseudonym does not exist'
      );
    }
  }

  /**
   * Fets the proband's MappingId from DB
   */
  public static async lookupMappingId(pseudonym: string): Promise<string> {
    try {
      return (
        await getRepository(Proband).findOneOrFail(pseudonym, {
          select: ['mappingId'],
        })
      ).mappingId;
    } catch (err) {
      throw Boom.notFound(
        'The proband with the given pseudonym does not exist'
      );
    }
  }

  /**
   * Gets the proband's external compliance from the DB
   */
  public static async getProbandExternalCompliance(
    pseudonym: string
  ): Promise<ExternalCompliance | null> {
    const repo = getRepository(Proband);
    const proband = await repo.findOne(pseudonym, {
      select: [
        'complianceBloodsamples',
        'complianceContact',
        'complianceLabresults',
        'complianceSamples',
      ],
    });
    return proband ?? null;
  }

  public static async getProbandsWithAccessToFromProfessional(
    username: string
  ): Promise<string[]> {
    return (
      await getRepository(Proband)
        .createQueryBuilder('proband')
        .select('proband.pseudonym')
        .innerJoin(
          StudyAccess,
          'access',
          'proband.study.name = access.studyName'
        )
        .where('access.username = :username', { username })
        .getMany()
    ).map((proband) => proband.pseudonym);
  }

  /**
   * Executes a patch and corresponding actions on a proband
   */
  public static async patchProband(
    pseudonym: string,
    attributes: ProbandComplianceContactPatch | ProbandStatusPatch
  ): Promise<void> {
    const repo = getRepository(Proband);
    const proband = await repo.findOne(pseudonym);

    if (!proband) {
      throw Boom.notFound('proband not found');
    }

    if (
      isProbandComplianceContactPatch(attributes) &&
      !attributes.complianceContact
    ) {
      await ProbandService.revokeComplianceContact(pseudonym);
    } else if (
      isProbandStatusPatch(attributes) &&
      attributes.status === ProbandStatus.DEACTIVATED
    ) {
      proband.status = ProbandStatus.DEACTIVATED;
      proband.deactivatedAt = new Date();

      await repo.save(proband);
      await messageQueueService.sendProbandDeactivated(
        pseudonym,
        proband.study?.name ?? ''
      );
    }
  }

  public static async getPseudonyms(
    study: string,
    status?: ProbandStatus,
    complianceContact?: boolean
  ): Promise<string[]> {
    return ProbandsRepository.getPseudonyms(study, status, complianceContact);
  }

  public static async getExternalIds(
    study: string,
    complianceContact: boolean
  ): Promise<ProbandExternalIdResponse[]> {
    const probandRepo = getRepository(Proband);
    return probandRepo.find({
      select: ['pseudonym', 'externalId'],
      where: {
        externalId: Not(IsNull()),
        study,
        complianceContact,
      },
    });
  }
}
