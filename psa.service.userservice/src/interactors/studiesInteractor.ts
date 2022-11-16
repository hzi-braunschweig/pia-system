/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as pgHelper from '../services/postgresqlHelper';
import Boom from '@hapi/boom';
import { DbStudy, Study } from '../models/study';
import { AccessToken, asyncMap, hasRealmRole } from '@pia/lib-service-core';
import { StudyWelcomeText } from '../models/studyWelcomeText';
import { ProbandAccountService } from '../services/probandAccountService';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { StudyService } from '../services/studyService';
import {
  StudyWelcomeMailTemplateRequestDto,
  StudyWelcomeMailTemplateResponseDto,
} from '../models/studyWelcomeEmail';
import { StudyWelcomeMailService } from '../services/studyWelcomeMailService';
import { StudyRepository } from '../repositories/studyRepository';

/**
 * @description interactor that handles study requests based on users permissions
 */
export class StudiesInteractor {
  /**
   * @description gets a study from DB if user is allowed to
   * @param studyName the id of the study to get
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudy(studyName: string): Promise<Study> {
    try {
      const study = await StudyRepository.getStudy(studyName);
      return StudyService.mapDbStudyToStudy(study);
    } catch (err) {
      console.error(err);
      throw Boom.notFound('Could not get the study');
    }
  }

  /**
   * @description gets all studies from DB the user has access to
   * @param decodedToken the jwt of the request
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudies(decodedToken: AccessToken): Promise<Study[]> {
    try {
      let studies;
      if (hasRealmRole('SysAdmin', decodedToken)) {
        studies = (await pgHelper.getStudies()) as DbStudy[];
      } else {
        studies = (await pgHelper.getStudiesByStudyIds(
          decodedToken.studies
        )) as DbStudy[];
      }
      return await asyncMap(
        studies,
        async (study) => await StudyService.mapDbStudyToStudy(study)
      );
    } catch (err) {
      throw Boom.badImplementation('Could not get studies', err);
    }
  }

  /**
   * @description creates a study in DB if user is allowed to
   * @param study the study to create
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async createStudy(study: Study): Promise<Study> {
    try {
      const result = (await pgHelper.createStudy(study)) as DbStudy;
      await ProbandAccountService.createStudy(study.name);
      await ProfessionalAccountService.createStudy(study.name);
      await StudyService.setTotpRequiredForStudy(
        study.has_required_totp,
        study.name
      );
      await StudyService.updateMaxAllowedAccountsCountOfStudy(study);
      return StudyService.mapDbStudyToStudy(result);
    } catch (err) {
      console.log('Could not create study:', err);
      throw Boom.notFound(String(err));
    }
  }

  /**
   * @description updates a study in DB if user is allowed to
   * @param id the id of the study to update
   * @param study the updates study
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudy(id: string, study: Study): Promise<Study> {
    try {
      await StudyService.setTotpRequiredForStudy(
        study.has_required_totp,
        study.name
      );
      await StudyService.updateMaxAllowedAccountsCountOfStudy(study);
      const result = (await pgHelper.updateStudyAsAdmin(id, study)) as DbStudy;
      return StudyService.mapDbStudyToStudy(result);
    } catch (err) {
      console.log('Could not update study:', err);
      throw Boom.notFound(String(err));
    }
  }

  /**
   * @description updates a study welcome text in DB if user is allowed to
   * @param studyName the id of the study to update
   * @param welcomeText the welcome text of the study
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudyWelcomeText(
    studyName: string,
    welcomeText: string
  ): Promise<StudyWelcomeText> {
    try {
      return (await pgHelper.updateStudyWelcomeText(
        studyName,
        welcomeText
      )) as StudyWelcomeText;
    } catch (err) {
      console.error(err);
      throw Boom.notFound('Could not update study welcome text');
    }
  }

  /**
   * @description updates a study welcome text in DB if user is allowed to
   * @param studyName the id of the study to update
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyWelcomeText(
    studyName: string
  ): Promise<StudyWelcomeText> {
    return (await pgHelper.getStudyWelcomeText(studyName)) as StudyWelcomeText;
  }

  /**
   * @description updates the study welcome mail content
   * @param studyName the name of the study
   * @param welcomeMail the mail content
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudyWelcomeMail(
    studyName: string,
    welcomeMail: StudyWelcomeMailTemplateRequestDto
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return await StudyWelcomeMailService.updateStudyWelcomeMailTemplate(
      studyName,
      welcomeMail
    );
  }

  /**
   * @description returns the study welcome mail content
   * @param studyName the name of the study
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyWelcomeMail(
    studyName: string
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return await StudyWelcomeMailService.getStudyWelcomeMailTemplate(studyName);
  }
}
