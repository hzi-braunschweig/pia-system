/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as pgHelper from '../services/postgresqlHelper';
import { AccessToken } from '@pia/lib-service-core';
import Boom from '@hapi/boom';
import { StudyAccess } from '../models/study_access';
import { Role } from '../models/role';

/**
 * @description interactor that handles study access requests based on users permissions
 */
export class StudyAccessesInteractor {
  /**
   * @function
   * @description deletes a study access from DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param study_name the study name of the access to delete
   * @param username the username of the access to delete
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async deleteStudyAccess(
    decodedToken: AccessToken,
    study_name: string,
    username: string
  ): Promise<StudyAccess> {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
        try {
          const role = (await pgHelper.getRoleOfUser(username)) as Role;
          if (role !== 'Proband') {
            return (await pgHelper.deleteStudyAccess(
              study_name,
              username
            )) as StudyAccess;
          }
        } catch (err) {
          console.error(err);
          throw Boom.notFound(`Could not delete study access`);
        }
        throw Boom.conflict('SysAdmin cannot delete study access for Proband');
      default:
        throw Boom.forbidden(
          'Could not delete study access: Unknown or wrong role'
        );
    }
  }

  /**
   * @function
   * @description creates a study access in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param study_name the study name of the access to create
   * @param study_access the study access to create
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async createStudyAccess(
    decodedToken: AccessToken,
    study_name: string,
    study_access: StudyAccess
  ): Promise<StudyAccess> {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
        try {
          const role = (await pgHelper.getRoleOfUser(
            study_access.user_id
          )) as Role;
          if (role !== 'Proband' && role !== 'SysAdmin') {
            return (await pgHelper.createStudyAccess(
              study_name,
              study_access
            )) as StudyAccess;
          }
        } catch (err) {
          console.error(err);
          throw Boom.notFound(`Could not create study access`);
        }
        throw Boom.conflict(
          'Could not create study access: SysAdmins cannot create study access for Probands or SysAdmins'
        );
      default:
        throw Boom.forbidden(
          'Could not create studyaccess: Unknown or wrong role'
        );
    }
  }

  /**
   * @function
   * @description updates a study access in DB if user is allowed to
   * @param decodedToken the jwt of the request
   * @param study_name the study name of the access to update
   * @param username the username of the access to update
   * @param study_access the study access to update
   * @returns promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateStudyAccess(
    decodedToken: AccessToken,
    study_name: string,
    username: string,
    study_access: StudyAccess
  ): Promise<StudyAccess> {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
        try {
          const role = (await pgHelper.getRoleOfUser(username)) as Role;
          if (role !== 'Proband' && role !== 'SysAdmin') {
            return (await pgHelper.updateStudyAccess(
              study_name,
              username,
              study_access
            )) as StudyAccess;
          }
        } catch (err) {
          console.error(err);
          throw Boom.notFound(`Could not update study access`);
        }
        throw Boom.conflict(
          'Could not update study access: SysAdmins cannot update study access for Probands or SysAdmins'
        );
      default:
        throw Boom.forbidden(
          'Could not create studyaccess: Unknown or wrong role'
        );
    }
  }
}
