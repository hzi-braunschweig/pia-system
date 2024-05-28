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
  AccountLogoutError,
  CannotGeneratePseudonymError,
  CannotUpdateAuthserverUsername,
  IdsAlreadyExistsError,
  PlannedProbandNotFoundError,
  ParticipantNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
  ParticipantDeleteError,
} from '../errors';
import {
  CreateProbandRequest,
  CreateProbandResponse,
  ProbandDataPatch,
  ProbandDto,
} from '../models/proband';
import { SecureRandomPasswordService } from './secureRandomPasswordService';
import { getConnection, getManager, getRepository, In } from 'typeorm';
import { RepositoryOptions } from '@pia/lib-service-core';
import { Proband } from '../entities/proband';
import { Study } from '../entities/study';
import { ProbandStatus } from '../models/probandStatus';
import { ProbandAccountService } from './probandAccountService';
import { AccountStatus } from '../models/accountStatus';
import assert from 'assert';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { generateRandomPseudonym } from '../helpers/generateRandomPseudonym';
import { PlannedProband } from '../entities/plannedProband';
import { ProbandOrigin } from '@pia-system/lib-http-clients-internal';

/**
 * The type of deletion which is evaluated when deleting a proband.
 * This is not equal to union type ProbandSelfDeletionType.
 */
export type ProbandDeletionType =
  | 'default' // delete all proband data but keep the pseudonym
  | 'keep_usage_data' // delete all proband data but keep usage data like logs and the pseudonym
  | 'full'; // fully delete all proband data

/**
 * The type of deletion a proband can choose when deleting their own account.
 * This is not equal to union type ProbandDeletionType.
 *
 * - 'full' deletes the account and all health data but keeps the pseudonym - equal to 'default' in ProbandDeletionType
 * - 'contact' deletes the account and contact data but keeps all health data
 */
export type ProbandSelfDeletionType = 'full' | 'contact';

export class ProbandService {
  public static async getAllProbandsOfStudy(
    studyName: string
  ): Promise<ProbandDto[]> {
    const probandAccountsList =
      await ProbandAccountService.getProbandAccountsByStudyName(studyName);
    const probandAccountsSet = new Set(
      probandAccountsList.map((account) => account.username)
    );

    return (
      await getRepository(Proband).find({ study: { name: studyName } })
    ).map((proband) => ({
      ...proband,
      study: studyName,
      accountStatus: probandAccountsSet.has(proband.pseudonym)
        ? AccountStatus.ACCOUNT
        : AccountStatus.NO_ACCOUNT,
    }));
  }

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

      const pseudonym = ids.toLowerCase();

      const newProband = probandRepo.create({
        pseudonym,
        ids: ids,
        status: ProbandStatus.ACTIVE,
        complianceContact: false,
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        isTestProband: false,
        study,
        // creating an IDS proband is only possible for investigators
        origin: ProbandOrigin.INVESTIGATOR,
      });
      await probandRepo.save(newProband).catch((e) => {
        console.error(e);
        throw new ProbandSaveError('could not create the proband', e);
      });

      await messageQueueService.sendProbandCreated(pseudonym, studyName);
    });
  }

  /**
   * Creates a proband with a generated pseudonym from registration.
   * We expect the initial account username to be an email address,
   * which will be replaced by the generated pseudonym.
   *
   * @param emailAsUsername
   * @return generated pseudonym
   */
  public static async createProbandForRegistration(
    emailAsUsername: string
  ): Promise<string> {
    const participant: Proband = await getConnection().transaction(
      async (entityManager) => {
        const probandRepo = entityManager.getRepository(Proband);
        const account = await ProbandAccountService.getProbandAccount(
          emailAsUsername
        );

        const study = await entityManager
          .getRepository(Study)
          .findOneOrFail(account.study);

        const newPseudonym = await this.generatePseudonym(study);

        const newProband = probandRepo.create({
          pseudonym: newPseudonym,
          study,
          status: ProbandStatus.ACTIVE,
          complianceContact: true,
          complianceBloodsamples: false,
          complianceLabresults: false,
          complianceSamples: false,
          studyCenter: null,
          examinationWave: null,
          ids: null,
          origin: ProbandOrigin.SELF,
        });

        try {
          await probandRepo.save(newProband);
        } catch (e) {
          throw new ProbandSaveError('could not save the proband', e);
        }

        return newProband;
      }
    );

    await this.logoutUser(emailAsUsername);
    await this.updateAuthServerUsername(emailAsUsername, participant.pseudonym);
    await messageQueueService.sendProbandCreated(
      participant.pseudonym,
      participant.study?.name ?? ''
    );

    return participant.pseudonym;
  }

  /**
   * Creates a new Proband or updates an existing with a pseudonym and adds an account.
   * @param studyName
   * @param newProbandData
   * @param usePlannedProband whether to use a planned proband otherwise generate a new password.
   * @param temporaryPassword
   * @returns password the password of the new created user
   * @throws PseudonymAlreadyExistsError
   * @throws StudyNotFoundError
   * @throws PlannedProbandNotFoundError if usePlannedProband is true but it cannot be found
   * @throws IdsAlreadyExistsError if usePlannedProband is false and ids exists for another proband
   * @throws ProbandSaveError
   * @throws ParticipantNotFoundError if usePlannedProband is true but no user with the ids exists
   * @throws AccountCreateError
   */
  public static async createProbandWithAccount(
    studyName: string,
    newProbandData: CreateProbandRequest,
    usePlannedProband: boolean,
    temporaryPassword: boolean
  ): Promise<CreateProbandResponse> {
    return getConnection().transaction(async (transactionEM) => {
      let password = '';
      const probandRepo = transactionEM.getRepository(Proband);

      // Check if study exists
      const study = await transactionEM.getRepository(Study).findOne(studyName);
      if (!study) {
        throw new StudyNotFoundError(`Study "${studyName}" does not exist`);
      }

      if (newProbandData.pseudonym) {
        // Check if pseudonym already exists
        const existingPseudonymProband = await probandRepo.findOne(
          newProbandData.pseudonym
        );
        if (existingPseudonymProband) {
          throw new PseudonymAlreadyExistsError(
            'The pseudonym is already in use'
          );
        }
      } else {
        newProbandData.pseudonym = await this.generatePseudonym(study);
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
          throw new ParticipantNotFoundError(
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
      newProband.complianceBloodsamples =
        newProbandData.complianceBloodsamples ?? false;
      newProband.complianceLabresults =
        newProbandData.complianceLabresults ?? false;
      newProband.complianceSamples = newProbandData.complianceSamples ?? false;
      newProband.studyCenter = newProbandData.studyCenter ?? null;
      newProband.examinationWave = newProbandData.examinationWave ?? null;
      newProband.ids = newProbandData.ids ?? null;
      newProband.study = study;
      newProband.origin = newProbandData.origin;

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
        await messageQueueService.sendProbandCreated(
          newProband.pseudonym,
          newProband.study.name
        );
      }
      return { pseudonym: newProband.pseudonym, password };
    });
  }

  public static async updateProband(
    pseudonym: string,
    studyAccess: string[],
    patch: ProbandDataPatch
  ): Promise<ProbandDto> {
    await getRepository(Proband).update(
      {
        pseudonym,
        study: { name: In(studyAccess) },
      },
      patch
    );
    return await this.getProbandByPseudonymOrFail(pseudonym, studyAccess);
  }

  public static async revokeComplianceContact(
    pseudonym: string
  ): Promise<void> {
    await getManager().transaction(async (entityManager) => {
      const studyName = await this.getStudyNameByProband(
        pseudonym,
        entityManager
      );

      if (!studyName) {
        throw new ParticipantDeleteError(
          `The participant ${pseudonym} was not found`
        );
      }

      await entityManager.getRepository(Proband).update(pseudonym, {
        complianceContact: false,
        status: ProbandStatus.DEACTIVATED,
        deactivatedAt: new Date(),
      });

      await ProbandAccountService.deleteProbandAccount(pseudonym);
      await messageQueueService.sendProbandDeactivated(pseudonym, studyName);
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

  /**
   * Returns the name of the study a proband or null if the proband does not exist.
   */
  private static async getStudyNameByProband(
    pseudonym: string,
    entityManager = getManager()
  ): Promise<string | null> {
    const proband = await entityManager
      .getRepository(Proband)
      .createQueryBuilder()
      .where('pseudonym = :pseudonym', { pseudonym })
      .select('study')
      .getRawOne<{ study: string }>();

    return proband?.study ?? null;
  }

  private static async deleteWithTransaction(
    pseudonym: string,
    deletionType: ProbandDeletionType,
    options: RepositoryOptions
  ): Promise<void> {
    const studyName = await this.getStudyNameByProband(pseudonym);

    if (!studyName) {
      throw new ParticipantDeleteError(
        `The participant ${pseudonym} was not found`
      );
    }

    await postgresqlHelper.deleteProbandData(pseudonym, deletionType, options);

    await ProbandAccountService.deleteProbandAccount(pseudonym, false);

    await messageQueueService.sendProbandDeleted(
      pseudonym,
      deletionType,
      studyName
    );
  }

  private static async generatePseudonym(study: Study): Promise<string> {
    if (!study.pseudonym_prefix) {
      throw new CannotGeneratePseudonymError(
        `study is missing pseudonym_prefix`
      );
    }

    if (!study.pseudonym_suffix_length) {
      throw new CannotGeneratePseudonymError(
        `study is missing pseudonym_suffix_length`
      );
    }

    return await generateRandomPseudonym(
      study.pseudonym_prefix,
      study.pseudonym_suffix_length
    );
  }

  private static async updateAuthServerUsername(
    username: string,
    newUsername: string
  ): Promise<void> {
    try {
      await ProbandAccountService.updateUsername(username, newUsername);
    } catch (e) {
      throw new CannotUpdateAuthserverUsername('could not update username', e);
    }
  }

  private static async logoutUser(username: string): Promise<void> {
    try {
      await ProbandAccountService.logoutUser(username);
    } catch (e) {
      throw new AccountLogoutError('logging user out failed', e);
    }
  }
}
