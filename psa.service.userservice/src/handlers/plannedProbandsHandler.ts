/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import Boom from '@hapi/boom';

import { PlannedProbandsInteractor } from '../interactors/plannedProbandsInteractor';
import { RESTPresenter } from '../services/RESTPresenter';
import { AccessToken } from '@pia/lib-service-core';

/**
 * @description HAPI Handler for planned probands
 */
export class PlannedProbandsHandler {
  /**
   * Get all planned probands the user has access to
   */
  public static getAll: Lifecycle.Method = async (request) => {
    const result = await PlannedProbandsInteractor.getPlannedProbands(
      request.auth.credentials as AccessToken
    ).catch((err) => {
      console.log('Could not get users from DB: ' + (err as Error).toString());
      throw Boom.notFound((err as Error).toString());
    });
    return RESTPresenter.presentPlannedProbands(result);
  };

  /**
   * Gets the planned proband if the user has access
   */
  public static getOne: Lifecycle.Method = async (request) => {
    const result = await PlannedProbandsInteractor.getPlannedProband(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch((err) => {
      console.log('Could not create user: ' + (err as Error).toString());
      throw Boom.notFound((err as Error).toString());
    });
    return RESTPresenter.presentPlannedProband(result);
  };

  /**
   * Creates all planned probands that do not exist already
   */
  public static createSome: Lifecycle.Method = async (request) => {
    const result = await PlannedProbandsInteractor.createPlannedProbands(
      request.auth.credentials as AccessToken,
      (request.payload as { pseudonyms: string[] }).pseudonyms
    ).catch((err) => {
      console.log('Could not create user in DB: ' + (err as Error).toString());
      throw Boom.conflict((err as Error).toString());
    });
    return RESTPresenter.presentPlannedProbands(result);
  };

  /**
   * Deletes the planned proband if the user has access
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    const result = await PlannedProbandsInteractor.deletePlannedProband(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch((err) => {
      console.log(
        'Could not delete user from DB: ' + (err as Error).toString()
      );
      throw Boom.notFound((err as Error).toString());
    });
    return RESTPresenter.presentPlannedProband(result);
  };
}
