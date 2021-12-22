/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { UsersInteractor } from '../interactors/usersInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { CreateProfessionalUser } from '../models/user';
import { handleError } from './handleError';

/**
 * HAPI Handler for users
 */
export class UsersHandler {
  /**
   * get all users the Forscher has access to
   * @param request
   */
  public static getAll: Lifecycle.Method = async (request) => {
    return UsersInteractor.getUsers(
      request.auth.credentials as AccessToken
    ).catch(handleError);
  };

  /**
   * gets all users with the same role as a requester
   * @param request
   */
  public static getAllWithSameRole: Lifecycle.Method = async (request) => {
    return UsersInteractor.getUsersWithSameRole(
      request.auth.credentials as AccessToken
    ).catch(handleError);
  };

  /**
   * gets the user if the Forscher has access
   * @param request
   */
  public static getOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['pseudonym'] as string;

    return UsersInteractor.getProband(
      request.auth.credentials as AccessToken,
      pseudonym
    ).catch(handleError);
  };

  public static getProbandByIDS: Lifecycle.Method = async (request) => {
    const token = request.auth.credentials as AccessToken;
    const ids = request.params['ids'] as string;

    return UsersInteractor.getProbandByIDS(token, ids).catch(handleError);
  };

  /**
   * creates the user if it does not exist
   * @param request
   */
  public static createOne: Lifecycle.Method = async (request) => {
    await UsersInteractor.createUser(
      request.auth.credentials as AccessToken,
      request.payload as CreateProfessionalUser
    ).catch(handleError);
    return null;
  };

  /**
   * changes attributes of a proband
   * @param request
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['username'] as string;
    const userValues = request.payload as { is_test_proband: boolean };

    await UsersInteractor.updateUser(
      request.auth.credentials as AccessToken,
      pseudonym,
      userValues
    ).catch(handleError);
    return null;
  };

  /**
   * deletes the user and all its data if the user is allowed to
   * @param request
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['username'] as string;

    await UsersInteractor.deleteUser(
      request.auth.credentials as AccessToken,
      pseudonym
    ).catch(handleError);
    return null;
  };
}
