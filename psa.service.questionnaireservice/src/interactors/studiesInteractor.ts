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
import { StudyAddress } from '../models/studyAddress';
import { MarkOptional } from 'ts-essentials';

/**
 * @description interactor that handles study requests based on users permissions
 *
 * @deprecated remaining proband API routes will be moved to the userservice in the future
 * @see https://confluence.sormas-tools.de/pages/viewpage.action?pageId=12978804
 */
export class StudiesInteractor {
  /**
   * @description gets a study from DB if proband is allowed to
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
   * @description updates a study welcome text in DB if proband is allowed to
   * @param studyName the id of the study to update
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyWelcomeText(
    studyName: string
  ): Promise<StudyWelcomeText> {
    return (await pgHelper.getStudyWelcomeText(studyName)) as StudyWelcomeText;
  }

  /**
   * @description gets a study address from DB if proband is allowed to
   * @param decodedToken the jwt of the request
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyAddresses(
    decodedToken: AccessToken
  ): Promise<StudyAddress[]> {
    try {
      return (await pgHelper.getStudyAddresses(
        decodedToken.studies
      )) as StudyAddress[];
    } catch (err) {
      console.log('Could not get study addresses from DB:', err);
      throw Boom.notFound(
        'Could not get study address, because it does not exist'
      );
    }
  }
}
