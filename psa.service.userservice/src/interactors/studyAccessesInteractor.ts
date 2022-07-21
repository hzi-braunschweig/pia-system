/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { EntityNotFoundError, getConnection, getRepository } from 'typeorm';
import { StudyAccess } from '../entities/studyAccess';
import { StudyAccessDto } from '../models/studyAccessDto';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { MissingPermissionError } from '../errors';
import { isForeignKeyError, isUniqueKeyError } from '@pia/lib-service-core';

/**
 * @description interactor that handles study access requests based on users permissions
 */
export class StudyAccessesInteractor {
  public static async getStudyAccesses(
    studyName: string
  ): Promise<StudyAccessDto[]> {
    return await getRepository(StudyAccess).find({
      studyName,
    });
  }

  /**
   * Creates a study access if user is allowed to
   *
   * @param studyAccessDto the study access to create
   */
  public static async createStudyAccess(
    studyAccessDto: StudyAccessDto
  ): Promise<StudyAccessDto> {
    await this.assertNotSysAdmin(studyAccessDto.username);

    try {
      return await getConnection().transaction(async (transactionEM) => {
        const studyAccessRepo = transactionEM.getRepository(StudyAccess);
        await studyAccessRepo.insert(studyAccessDto);
        await ProfessionalAccountService.grantStudyAccess(
          studyAccessDto.username,
          studyAccessDto.studyName
        );
        return studyAccessDto;
      });
    } catch (err) {
      if (isForeignKeyError(err)) {
        throw Boom.notFound(
          `Could not create study access because study was not found`
        );
      }
      if (isUniqueKeyError(err)) {
        throw Boom.conflict(
          `Could not create study access because study access already exists`
        );
      }
      console.error(err);
      throw Boom.internal(`Could not create study access`);
    }
  }

  /**
   * Updates a study access if user is allowed to
   *
   * @param studyAccessDto the study access to update
   */
  public static async updateStudyAccessLevel(
    studyAccessDto: StudyAccessDto
  ): Promise<StudyAccessDto> {
    await this.assertNotSysAdmin(studyAccessDto.username);
    const compositeKey = {
      username: studyAccessDto.username,
      studyName: studyAccessDto.studyName,
    };

    try {
      const studyAccessRepo = getRepository(StudyAccess);
      await studyAccessRepo.findOneOrFail(compositeKey);
      await studyAccessRepo.update(compositeKey, studyAccessDto);
      return studyAccessDto;
    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        throw Boom.notFound(
          `Could not update study access because study was not found`
        );
      }
      console.error(err);
      throw Boom.internal(`Could not update study access`);
    }
  }

  /**
   * Deletes a study access from DB if user is allowed to
   *
   * @param studyName the study name of the access to delete
   * @param username the username of the access to delete
   */
  public static async deleteStudyAccess(
    studyName: string,
    username: string
  ): Promise<void> {
    await this.assertNotSysAdmin(username);
    const compositeKey = {
      username,
      studyName,
    };

    try {
      return await getConnection().transaction(async (transactionEM) => {
        const studyAccessRepo = transactionEM.getRepository(StudyAccess);
        await studyAccessRepo.findOneOrFail(compositeKey);
        await studyAccessRepo.delete(compositeKey);
        await ProfessionalAccountService.revokeStudyAccess(username, studyName);
      });
    } catch (err) {
      if (err instanceof EntityNotFoundError) {
        throw Boom.notFound(
          `Could not delete study access because study was not found`
        );
      }
      console.error(err);
      throw Boom.notFound(`Could not delete study access`);
    }
  }

  private static async assertNotSysAdmin(username: string): Promise<void> {
    if (
      (await ProfessionalAccountService.getPrimaryRoleOfProfessional(
        username
      )) === 'SysAdmin'
    ) {
      throw new MissingPermissionError(
        'Could not modify study access: SysAdmins cannot create, update or delete study accesses for SysAdmins'
      );
    }
  }
}
