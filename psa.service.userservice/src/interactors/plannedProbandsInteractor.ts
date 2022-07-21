/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccessToken } from '@pia/lib-service-core';
import pgHelper from '../services/postgresqlHelper';
import { SecureRandomPasswordService } from '../services/secureRandomPasswordService';
import { PlannedProbandDeprecated } from '../models/plannedProband';

/**
 * @description interactor that handles user requests based on users permissions
 */
export class PlannedProbandsInteractor {
  /**
   * Gets all planned probands from DB the user has access to
   */
  public static async getPlannedProbands(
    decodedToken: AccessToken
  ): Promise<PlannedProbandDeprecated[]> {
    return pgHelper
      .getPlannedProbandsAsUser(decodedToken.username)
      .catch((err) => {
        console.log(err);
        throw new Error(
          'Could not get planned probands, because user has no access'
        );
      }) as Promise<PlannedProbandDeprecated[]>;
  }

  /**
   * Gets a planned proband from DB if user is allowed to
   */
  public static async getPlannedProband(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PlannedProbandDeprecated> {
    return pgHelper
      .getPlannedProbandAsUser(pseudonym, decodedToken.username)
      .catch((err) => {
        console.log(err);
        throw new Error(
          'Could not get planned proband, because user has no access or it does not exist'
        );
      }) as Promise<PlannedProbandDeprecated>;
  }

  /**
   * Creates planned probands in DB if they do not exist and the requester is allowed to
   */
  public static async createPlannedProbands(
    decodedToken: AccessToken,
    pseudonyms: string[]
  ): Promise<PlannedProbandDeprecated[]> {
    if (!decodedToken.studies.length) {
      throw new Error(
        'Could not create the planned probands: User has no write access to any study'
      );
    }
    const plannedProbandsToCreate = pseudonyms.map((pseudonym) => [
      pseudonym,
      SecureRandomPasswordService.generate(),
      null,
    ]);
    return pgHelper
      .createPlannedProbands(plannedProbandsToCreate, decodedToken.studies)
      .catch((err) => {
        console.log(err);
        throw new Error(
          'could not create planned probands: ' + (err as Error).toString()
        );
      }) as Promise<PlannedProbandDeprecated[]>;
  }

  /**
   * Deletes a planned proband and all its data from DB if user is allowed to
   */
  public static async deletePlannedProband(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<PlannedProbandDeprecated> {
    return pgHelper
      .deletePlannedProbandAsUser(pseudonym, decodedToken.username)
      .catch((err) => {
        console.log(err);
        throw new Error(
          'could not delete planned proband: ' + (err as Error).toString()
        );
      }) as Promise<PlannedProbandDeprecated>;
  }
}
