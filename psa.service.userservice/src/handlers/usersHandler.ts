/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import {
  GetProfessionalAccountsFilters,
  UsersInteractor,
} from '../interactors/usersInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { CreateProfessionalUser } from '../models/user';
import { handleError } from './handleError';

/**
 * HAPI Handler for users
 */
export class UsersHandler {
  /**
   * Gets professional accounts filltered by given properties
   */
  public static getProfessionalAccounts: Lifecycle.Method = async (request) => {
    return UsersInteractor.getProfessionalAccounts(
      request.auth.credentials as AccessToken,
      request.query as GetProfessionalAccountsFilters
    ).catch(handleError);
  };

  public static getProbandAsProfessional: Lifecycle.Method = async (
    request
  ) => {
    return UsersInteractor.getProbandAsProfessional(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch(handleError);
  };

  public static getProbandByIDS: Lifecycle.Method = async (request) => {
    return UsersInteractor.getProbandByIDS(
      request.auth.credentials as AccessToken,
      request.params['ids'] as string
    ).catch(handleError);
  };

  /**
   * Creates the user if it does not exist
   */
  public static createOne: Lifecycle.Method = async (request) => {
    await UsersInteractor.createProfessionalUser(
      request.payload as CreateProfessionalUser
    );
    return null;
  };

  /**
   * Changes attributes of a proband
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    await UsersInteractor.updateProband(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.payload as { is_test_proband: boolean }
    ).catch(handleError);
    return null;
  };

  /**
   * Deletes the user and all its data if the user is allowed to
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    await UsersInteractor.deleteProfessionalUser(
      request.params['username'] as string
    );
    return null;
  };
}
