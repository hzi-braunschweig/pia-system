/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as pgHelper from '../services/postgresqlHelper';
import Boom from '@hapi/boom';
import { Study } from '../models/study';
import { AccessToken, hasRealmRole } from '@pia/lib-service-core';
import { StudyWelcomeText } from '../models/studyWelcomeText';
import { MarkOptional } from 'ts-essentials';
import { ProbandAccountService } from '../services/probandAccountService';
import { ProfessionalAccountService } from '../services/professionalAccountService';

/**
 * @description interactor that handles study requests based on users permissions
 */
export class StudiesInteractor {
  /**
   * @description gets a study from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param studyName the id of the study to get
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudy(
    decodedToken: AccessToken,
    studyName: string
  ): Promise<MarkOptional<Study, 'pm_email' | 'hub_email'>> {
    try {
      const study = (await pgHelper.getStudy(studyName)) as MarkOptional<
        Study,
        'pm_email' | 'hub_email'
      >;
      if (hasRealmRole('Proband', decodedToken)) {
        delete study.pm_email;
        delete study.hub_email;
      }
      return study;
    } catch (err) {
      console.error(err);
      throw Boom.notFound('Could not get study, because it does not exist');
    }
  }

  /**
   * @description gets all studies from DB the user has access to
   * @param decodedToken the jwt of the request
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudies(
    decodedToken: AccessToken
  ): Promise<MarkOptional<Study, 'pm_email' | 'hub_email'>[]> {
    try {
      if (hasRealmRole('SysAdmin', decodedToken)) {
        return (await pgHelper.getStudies()) as Study[];
      } else {
        return (await pgHelper.getStudiesByStudyIds(
          decodedToken.studies
        )) as MarkOptional<Study, 'pm_email' | 'hub_email'>[];
      }
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
      const result = (await pgHelper.createStudy(study)) as Study;
      await ProbandAccountService.createStudy(study.name);
      await ProfessionalAccountService.createStudy(study.name);
      return result;
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
      return (await pgHelper.updateStudyAsAdmin(id, study)) as Study;
    } catch (err) {
      console.log('Could not update study in DB:', err);
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
}
