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
  ProbandResponse,
  ProbandStatusPatch,
} from '../../models/proband';
import { ExternalCompliance } from '../../models/externalCompliance';
import { StudyAccessRepository } from '../../repositories/studyAccessRepository';
import { messageQueueService } from '../../services/messageQueueService';
import {
  ProbandDeletionType,
  ProbandService,
} from '../../services/probandService';
import {
  AccountCreateError,
  IdsAlreadyExistsError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../../errors';
import { getRepository } from 'typeorm';
import { Proband } from '../../entities/proband';
import { authserviceClient } from '../../clients/authserviceClient';
import { ProbandStatus } from '../../models/probandStatus';
import { ProbandsRepository } from '../../repositories/probandsRepository';

/**
 * Internal interactor that handles proband requests
 */
export class InternalProbandsInteractor {
  public static async createProband(
    studyName: string,
    probandRequest: CreateProbandRequest
  ): Promise<CreateProbandResponse> {
    let password: string;
    try {
      password = await ProbandService.createProbandWithAccount(
        studyName,
        probandRequest,
        false
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
      } else {
        console.error(e);
        throw Boom.badImplementation('an unknown error occurred');
      }
    }
    return {
      pseudonym: probandRequest.pseudonym,
      password: password,
    };
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

  public static async getProbandByIDS(ids: string): Promise<ProbandResponse> {
    const proband = await ProbandsRepository.getProbandByIDS(ids);
    if (!proband) {
      throw Boom.notFound('proband not found');
    }
    return proband;
  }

  /**
   * Gets the proband's IDS from DB
   */
  public static async lookupIds(pseudonym: string): Promise<string | null> {
    const repo = getRepository(Proband);
    const proband = await repo.findOne(pseudonym, { select: ['ids'] });
    if (!proband) {
      throw Boom.notFound('proband not found');
    }
    return proband.ids;
  }

  /**
   * Fets the proband's MappingId from DB
   */
  public static async lookupMappingId(pseudonym: string): Promise<string> {
    const repo = getRepository(Proband);
    const proband = await repo.findOne(pseudonym, { select: ['mappingId'] });
    if (!proband) {
      throw Boom.notFound('proband not found');
    }
    return proband.mappingId;
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

  public static async getProbandsWithAcessToFromProfessional(
    pseudonym: string
  ): Promise<string[]> {
    return StudyAccessRepository.getProbandsWithAcessToFromProfessional(
      pseudonym
    );
  }

  /**
   * Gets the proband by pseudonym
   */
  public static async getProband(pseudonym: string): Promise<ProbandResponse> {
    const proband = await ProbandsRepository.getProband(pseudonym);
    if (!proband) {
      throw Boom.notFound(
        'The proband with the given pseudonym does not exist'
      );
    }
    return proband;
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
      await authserviceClient.deleteAccount(pseudonym);
      await messageQueueService.sendProbandDeactivated(pseudonym);
      await repo.update(proband.pseudonym, {
        complianceContact: false,
        status: ProbandStatus.DEACTIVATED,
      });
    } else if (
      isProbandStatusPatch(attributes) &&
      attributes.status === ProbandStatus.DEACTIVATED
    ) {
      proband.status = ProbandStatus.DEACTIVATED;
      await repo.save(proband);
      await messageQueueService.sendProbandDeactivated(pseudonym);
    }
  }

  public static async getPseudonyms(
    study: string,
    status?: ProbandStatus,
    complianceContact?: boolean
  ): Promise<string[]> {
    return ProbandsRepository.getPseudonyms(study, status, complianceContact);
  }
}
