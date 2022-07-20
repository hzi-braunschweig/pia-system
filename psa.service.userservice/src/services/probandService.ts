/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ITask } from 'pg-promise';

import { runTransaction } from '../db';
import postgresqlHelper from './postgresqlHelper';
import { messageQueueService } from './messageQueueService';
import {
  IdsAlreadyExistsError,
  PlannedProbandNotFoundError,
  ProbandNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../errors';
import { CreateProbandRequest, ProbandDto } from '../models/proband';
import { SecureRandomPasswordService } from './secureRandomPasswordService';
import { getConnection, getRepository, getManager, In } from 'typeorm';
import { PlannedProband } from '../entities/plannedProband';
import { RepositoryOptions } from '@pia/lib-service-core';
import { Proband } from '../entities/proband';
import { Study } from '../entities/study';
import { ProbandStatus } from '../models/probandStatus';
import { ProbandAccountService } from './probandAccountService';
import { AccountStatus } from '../models/accountStatus';
import assert from 'assert';
import { FindConditions } from 'typeorm/find-options/FindConditions';

export type ProbandDeletionType =
  | 'default' // delete all proband data but keep the pseudonym
  | 'keep_usage_data' // delete all proband data but keep usage data like logs and the pseudonym
  | 'full'; // fully delete all proband data

/**
 * Probands may choose to delete their account and all health data (full) or
 * to delete their account and contact data but leave their health data.
 */
export type ProbandAccountDeletionType = 'full' | 'contact';

export class ProbandService {
  public static async getProbandByPseudonymOrFail(
    pseudonym: string,
    studyAccess?: string[]
  ): Promise<ProbandDto> {
    const studyAccessFilter = studyAccess
      ? { study: { name: In(studyAccess) } }
      : {};
    return await this.getProband({ pseudonym, ...studyAccessFilter });
  }

  public static async getProbandByIdsOrFail(
    ids: string,
    studyAccess?: string[]
  ): Promise<ProbandDto> {
    const studyAccessFilter = studyAccess
      ? { study: { name: In(studyAccess) } }
      : {};
    return await this.getProband({ ids, ...studyAccessFilter });
  }

  public static async assertProbandExistsWithStudyAccess(
    pseudonym: string,
    studyAccess: string[]
  ): Promise<void> {
    await this.getProband({ pseudonym, study: { name: In(studyAccess) } });
  }

  /**
   *
   * @param studyName
   * @param ids
   * @throws PseudonymAlreadyExistsError
   * @throws StudyNotFoundError
   * @throws IdsAlreadyExistsError
   * @throws ProbandSaveError
   */
  public static async createIDSProbandWithoutAccount(
    studyName: string,
    ids: string
  ): Promise<void> {
    await getConnection().transaction(async (transactionEM) => {
      const probandRepo = transactionEM.getRepository(Proband);

      // Check if pseudonym already exists
      const existingPseudonymProband = await probandRepo.findOne(ids);
      if (existingPseudonymProband) {
        throw new PseudonymAlreadyExistsError(
          'The pseudonym is already assigned'
        );
      }

      // Check if study exists
      const study = await transactionEM.getRepository(Study).findOne(studyName);
      if (!study) {
        throw new StudyNotFoundError(`Study "${studyName}" does not exist`);
      }

      // Check if IDS already exists
      const existingIdsProband = await probandRepo.findOne({
        ids: ids,
      });
      if (existingIdsProband) {
        throw new IdsAlreadyExistsError('The ids is already assigned');
      }

      const newProband = probandRepo.create({
        pseudonym: ids,
        ids: ids,
        status: ProbandStatus.ACTIVE,
        complianceContact: false,
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        isTestProband: false,
        study: study,
      });
      await probandRepo.save(newProband).catch((e) => {
        throw new ProbandSaveError('could not create the proband', e);
      });

      await messageQueueService.sendProbandCreated(ids);
    });
  }

  /**
   * Creates a new Proband or updates an existing with a pseudonym and adds an account.
   * @param studyName
   * @param newProbandData
   * @param usePlannedProband whether to use a planned proband otherwise generate a new password.
   * @returns password the password of the new created user
   * @throws PseudonymAlreadyExistsError
   * @throws StudyNotFoundError
   * @throws PlannedProbandNotFoundError if usePlannedProband is true but it cannot be found
   * @throws IdsAlreadyExistsError if usePlannedProband is false and ids exists for another proband
   * @throws ProbandSaveError
   * @throws ProbandNotFoundError if usePlannedProband is true but no user with the ids exists
   * @throws AccountCreateError
   */
  public static async createProbandWithAccount(
    studyName: string,
    newProbandData: CreateProbandRequest,
    usePlannedProband: boolean,
    temporaryPassword: boolean
  ): Promise<string> {
    return getConnection().transaction(async (transactionEM) => {
      let password = '';
      const probandRepo = transactionEM.getRepository(Proband);

      // Check if pseudonym already exists
      const existingPseudonymProband = await probandRepo.findOne(
        newProbandData.pseudonym
      );
      if (existingPseudonymProband) {
        throw new PseudonymAlreadyExistsError(
          'The pseudonym is already assigned'
        );
      }

      // Check if study exists
      const study = await transactionEM.getRepository(Study).findOne(studyName);
      if (!study) {
        throw new StudyNotFoundError(`Study "${studyName}" does not exist`);
      }

      // Find Proband by IDS
      let existingIdsProband: undefined | Proband = undefined;
      if (newProbandData.ids) {
        existingIdsProband = await probandRepo.findOne({
          ids: newProbandData.ids,
        });
      }

      if (usePlannedProband) {
        const plannedProbandsRepo = transactionEM.getRepository(PlannedProband);
        const plannedProband = await plannedProbandsRepo
          .createQueryBuilder('plannedProband')
          .leftJoin('plannedProband.studies', 'study')
          .where('study.name = :studyName', { studyName: studyName })
          .andWhere('plannedProband.pseudonym = :pseudonym', {
            pseudonym: newProbandData.pseudonym,
          })
          .getOne();
        if (!plannedProband) {
          throw new PlannedProbandNotFoundError(
            'Could not find a related planned proband'
          );
        }
        plannedProband.activatedAt = new Date();
        await plannedProbandsRepo.save(plannedProband);

        password = plannedProband.password;
      } else {
        password = SecureRandomPasswordService.generate();
      }

      let probandCreated = false;
      let newProband: Proband;
      if (usePlannedProband && newProbandData.ids) {
        // proband already exists so update proband with IDS
        if (!existingIdsProband) {
          throw new ProbandNotFoundError(
            'The proband could not be found by the given ids'
          );
        }
        // change pseudonym from ids to pseudonym
        await probandRepo
          .update(existingIdsProband.pseudonym, {
            pseudonym: newProbandData.pseudonym,
          })
          .catch((e) => {
            throw new ProbandSaveError('could not update the proband', e);
          });
        existingIdsProband.pseudonym = newProbandData.pseudonym;
        newProband = existingIdsProband;
      } else {
        // create proband
        if (newProbandData.ids && existingIdsProband) {
          throw new IdsAlreadyExistsError('The ids is already assigned');
        }
        newProband = probandRepo.create({
          pseudonym: newProbandData.pseudonym,
          status: ProbandStatus.ACTIVE,
        });
        probandCreated = true;
      }

      // Apply compliance and other data
      newProband.complianceContact = true;
      newProband.complianceBloodsamples = newProbandData.complianceBloodsamples;
      newProband.complianceLabresults = newProbandData.complianceLabresults;
      newProband.complianceSamples = newProbandData.complianceSamples;
      newProband.studyCenter = newProbandData.studyCenter ?? null;
      newProband.examinationWave = newProbandData.examinationWave ?? null;
      newProband.ids = newProbandData.ids ?? null;
      newProband.study = study;
      await probandRepo.save(newProband).catch((e) => {
        throw new ProbandSaveError('could not create the proband', e);
      });

      await ProbandAccountService.createProbandAccount(
        newProband.pseudonym,
        newProband.study.name,
        password,
        temporaryPassword
      );

      if (probandCreated) {
        await messageQueueService.sendProbandCreated(newProbandData.pseudonym);
      }
      return password;
    });
  }

  public static async revokeComplianceContact(
    pseudonym: string
  ): Promise<void> {
    await getManager().transaction(async (entityManager) => {
      await entityManager.getRepository(Proband).update(pseudonym, {
        complianceContact: false,
        status: ProbandStatus.DEACTIVATED,
        deactivatedAt: new Date(),
      });
      await ProbandAccountService.deleteProbandAccount(pseudonym);
      await messageQueueService.sendProbandDeactivated(pseudonym);
    });
  }

  /**
   * Delete a proband and all its data
   *
   * It will delete all data of the user, including questionnaire answers, lab results,
   * personal data, user logs, etc. Some data are deleted by the corresponding service
   * and might not be deleted right after the returned Promise resolves.
   *
   * You may influence how many data should be deleted by passing a valid deletionType.
   * @see {@link ProbandDeletionType} for more information.
   */
  public static async delete(
    pseudonym: string,
    deletionType: ProbandDeletionType = 'default',
    options?: RepositoryOptions
  ): Promise<void> {
    if (options?.transaction) {
      return this.deleteWithTransaction(pseudonym, deletionType, options);
    } else {
      return runTransaction<void>(async (t: ITask<unknown>) => {
        return this.deleteWithTransaction(pseudonym, deletionType, {
          transaction: t,
        });
      });
    }
  }

  public static async updateExternalId(
    pseudonym: string,
    externalId: string
  ): Promise<void> {
    await getRepository(Proband).update(pseudonym, { externalId });
  }

  public static async getProbandAccountStatus(
    pseudonym: string
  ): Promise<AccountStatus> {
    try {
      await ProbandAccountService.getProbandAccount(pseudonym);
      return AccountStatus.ACCOUNT;
    } catch (e) {
      return AccountStatus.NO_ACCOUNT;
    }
  }

  public static async mapProbandToProbandDto(
    proband: Proband
  ): Promise<ProbandDto> {
    assert(proband.study, 'Proband account is not assigned to a study');
    return {
      ...proband,
      accountStatus: await this.getProbandAccountStatus(proband.pseudonym),
      study: proband.study.name,
    };
  }

  private static async getProband(
    where: FindConditions<Proband>
  ): Promise<ProbandDto> {
    return this.mapProbandToProbandDto(
      await getRepository(Proband).findOneOrFail({
        where,
        loadRelationIds: {
          relations: ['study'],
          disableMixedMap: true,
        },
      })
    );
  }

  private static async deleteWithTransaction(
    pseudonym: string,
    deletionType: ProbandDeletionType,
    options: RepositoryOptions
  ): Promise<void> {
    await postgresqlHelper.deleteProbandData(pseudonym, deletionType, options);

    await ProbandAccountService.deleteProbandAccount(pseudonym, false);

    await messageQueueService.sendProbandDelete(pseudonym, deletionType);
  }
}
