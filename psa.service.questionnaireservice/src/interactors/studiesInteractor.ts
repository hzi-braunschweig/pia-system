/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as pgHelper from '../services/postgresqlHelper';
import Boom from '@hapi/boom';
import { Study } from '../models/study';
import { AccessToken } from '@pia/lib-service-core';
import { StudyAccess } from '../models/study_access';
import { StudyWelcomeText } from '../models/studyWelcomeText';
import { assertStudyAccess } from '../services/studyAccessAssert';
import { MarkOptional } from 'ts-essentials';

/**
 * @description interactor that handles study requests based on users permissions
 */
export class StudiesInteractor {
  /**
   * @description gets a study from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the study to get
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudy(
    decodedToken: AccessToken,
    id: string
  ): Promise<MarkOptional<Study, 'pm_email' | 'hub_email'>> {
    const userRole = decodedToken.role;
    const studyIDs = decodedToken.groups;

    if (
      ![
        'Untersuchungsteam',
        'ProbandenManager',
        'Forscher',
        'SysAdmin',
        'Proband',
      ].includes(userRole)
    ) {
      throw Boom.forbidden('Could not get study: Unknown or wrong role');
    }

    if (userRole !== 'SysAdmin') {
      if (!studyIDs.includes(id)) {
        throw Boom.forbidden('Could not get study: no access to study');
      }
    }
    try {
      const study = (await pgHelper.getStudy(id)) as MarkOptional<
        Study,
        'pm_email' | 'hub_email'
      >;
      if (userRole === 'Proband') {
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
    const userRole = decodedToken.role;
    const studyIDs = decodedToken.groups;

    if (
      ![
        'Untersuchungsteam',
        'ProbandenManager',
        'EinwilligungsManager',
        'Forscher',
        'SysAdmin',
        'Proband', // for backwards compatibility
      ].includes(userRole)
    ) {
      throw Boom.forbidden('Could not get studies: Unknown or wrong role');
    }

    try {
      if (userRole === 'SysAdmin') {
        return (await pgHelper.getStudies()) as Study[];
      }

      const studies = (await pgHelper.getStudiesByStudyIds(
        studyIDs
      )) as MarkOptional<Study, 'pm_email' | 'hub_email'>[];

      if (userRole === 'Proband') {
        for (const study of studies) {
          delete study.pm_email;
          delete study.hub_email;
        }
      }
      return studies;
    } catch (err) {
      throw Boom.badImplementation('Could not get studies', err);
    }
  }

  /**
   * @description creates a study in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param study the study to create
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async createStudy(
    decodedToken: AccessToken,
    study: Study
  ): Promise<Study> {
    const userRole = decodedToken.role;

    if (userRole === 'SysAdmin') {
      return (await pgHelper.createStudy(study)) as Study;
    } else {
      throw Boom.forbidden('Could not create study: Unknown or wrong role');
    }
  }

  /**
   * @description updates a study in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param id the id of the study to update
   * @param study the updates study
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudy(
    decodedToken: AccessToken,
    id: string,
    study: Study
  ): Promise<Study> {
    const userRole = decodedToken.role;

    if (userRole === 'SysAdmin') {
      return (await pgHelper.updateStudyAsAdmin(id, study)) as Study;
    } else {
      throw Boom.forbidden('Could not update study: Unknown or wrong role');
    }
  }

  /**
   * @description updates a study welcome text in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param studyId the id of the study to update
   * @param welcomeText the welcome text of the study
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudyWelcomeText(
    decodedToken: AccessToken,
    studyId: string,
    welcomeText: string
  ): Promise<StudyWelcomeText> {
    const userRole = decodedToken.role;
    switch (userRole) {
      case 'Forscher':
        assertStudyAccess(studyId, decodedToken);
        try {
          return (await pgHelper.updateStudyWelcomeText(
            studyId,
            welcomeText
          )) as StudyWelcomeText;
        } catch (err) {
          console.error(err);
          throw Boom.notFound('Could not update study welcome text');
        }
      default:
        throw Boom.forbidden(
          'Could not update study welcome text: Unknown or wrong role'
        );
    }
  }

  /**
   * @description updates a study welcome text in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param studyId the id of the study to update
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyWelcomeText(
    decodedToken: AccessToken,
    studyId: string
  ): Promise<StudyWelcomeText> {
    const userRole = decodedToken.role;
    switch (userRole) {
      case 'Forscher':
      case 'Proband':
        assertStudyAccess(studyId, decodedToken);
        return (await pgHelper.getStudyWelcomeText(
          studyId
        )) as StudyWelcomeText;
      default:
        throw Boom.forbidden(
          'Could not get study welcome text: Unknown or wrong role'
        );
    }
  }

  /**
   * @description gets a study address from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getStudyAddresses(
    decodedToken: AccessToken
  ): Promise<StudyAccess[]> {
    const userRole = decodedToken.role;
    const studyIDs = decodedToken.groups;

    switch (userRole) {
      case 'Proband': {
        try {
          return (await pgHelper.getStudyAddresses(studyIDs)) as StudyAccess[];
        } catch (err) {
          console.log(err);
          throw Boom.notFound(
            'Could not get study address, because it does not exist'
          );
        }
      }
      default:
        throw Boom.forbidden(
          'Could not get study address: Unknown or wrong role'
        );
    }
  }
}
