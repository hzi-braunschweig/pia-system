/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AccessToken } from '@pia/lib-service-core';
import Boom from '@hapi/boom';
import { getRepository } from 'typeorm';
import { Proband } from '../entities/proband';

interface UserSettings {
  logging_active: boolean;
}

/**
 * @description interactor that handles user requests based on users permissions
 */
export class UserSettingsInteractor {
  /**
   * @description updates the user's settings
   * @param {object} decodedToken the decoded jwt of the request
   * @param {object} userSettings the user settings to update
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async updateUserSettings(
    decodedToken: AccessToken,
    pseudonym: string,
    userSettings: UserSettings
  ): Promise<UserSettings> {
    const userRole = decodedToken.role;
    const username = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        if (pseudonym !== username)
          throw new Error("decodedToken name and request name don't match");
        else {
          const repo = getRepository(Proband);
          await repo.update(pseudonym, {
            loggingActive: userSettings.logging_active,
          });
          return userSettings;
        }
      default:
        throw new Error('Could not update user settings: wrong role ');
    }
  }

  /**
   * @description updates the user's settings
   * @param {object} decodedToken the decoded jwt of the request
   * @param {object} pgHelper helper object to query postgres db
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getUserSettings(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<UserSettings | { logging_active: null }> {
    const userRole = decodedToken.role;
    const username = decodedToken.username;

    switch (userRole) {
      case 'Proband':
        if (pseudonym !== username)
          throw new Error("decodedToken name and request name don't match");
        else {
          const repo = getRepository(Proband);
          const proband = await repo.findOne(pseudonym);
          if (!proband) {
            throw Boom.notFound('proband not found');
          }
          return { logging_active: proband.loggingActive };
        }
      default:
        throw new Error('Could not get user settings: wrong role');
    }
  }
}
