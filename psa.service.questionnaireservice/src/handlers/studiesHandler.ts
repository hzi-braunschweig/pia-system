/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { RESTPresenter } from '../services/RESTPresenter';
import { StudiesInteractor } from '../interactors/studiesInteractor';
import { Lifecycle, Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';
import { Study } from '../models/study';

/**
 * @description HAPI Handler for studies
 */
export class StudiesHandler {
  /**
   * @description gets the study if the user has access
   */
  public static getOne: Lifecycle.Method = async (request: Request) => {
    const name = request.params['name'] as string;

    return StudiesInteractor.getStudy(
      request.auth.credentials as AccessToken,
      name
    ).then(function (result) {
      return RESTPresenter.presentStudy(result);
    });
  };

  /**
   * @description get all studies the user has access to
   */
  public static getAll: Lifecycle.Method = async (request: Request) => {
    return StudiesInteractor.getStudies(
      request.auth.credentials as AccessToken
    ).then(function (result) {
      return RESTPresenter.presentStudies(result);
    });
  };

  /**
   * @description creates the study if the user has access
   */
  public static createOne: Lifecycle.Method = async (request: Request) => {
    const study = request.payload as Study;

    return StudiesInteractor.createStudy(
      request.auth.credentials as AccessToken,
      study
    )
      .then(function (result) {
        return RESTPresenter.presentStudy(result);
      })
      .catch((err) => {
        console.log('Could not create study in DB:', err);
        return Boom.notFound(String(err));
      });
  };

  /**
   * @description updates the study if the user has access
   */
  public static updateOne: Lifecycle.Method = async (request: Request) => {
    const name = request.params['name'] as string;
    const study = request.payload as Study;

    return StudiesInteractor.updateStudy(
      request.auth.credentials as AccessToken,
      name,
      study
    )
      .then(function (result) {
        return RESTPresenter.presentStudy(result);
      })
      .catch((err) => {
        console.log('Could not update study in DB:', err);
        return Boom.notFound(String(err));
      });
  };

  /**
   * @description updates the study welcome text if the user has access
   */
  public static updateStudyWelcomeText: Lifecycle.Method = async (
    request: Request
  ) => {
    const studyName = request.params['name'] as string;
    const welcomeText = (request.payload as { welcome_text: string })
      .welcome_text;
    return StudiesInteractor.updateStudyWelcomeText(
      request.auth.credentials as AccessToken,
      studyName,
      welcomeText
    ).then(function (result) {
      return RESTPresenter.presentStudyWelcomeText(result);
    });
  };

  /**
   * @description gets the study welcome text if the user has access
   */
  public static getStudyWelcomeText: Lifecycle.Method = async (
    request: Request
  ) => {
    const studyName = request.params['name'] as string;
    return StudiesInteractor.getStudyWelcomeText(
      request.auth.credentials as AccessToken,
      studyName
    ).then(function (result) {
      return RESTPresenter.presentStudyWelcomeText(result);
    });
  };

  /**
   * @description gets the study access if the user has access
   */
  public static getStudyAddresses: Lifecycle.Method = async (
    request: Request
  ) => {
    return StudiesInteractor.getStudyAddresses(
      request.auth.credentials as AccessToken
    )
      .then(function (result) {
        return result;
      })
      .catch((err) => {
        console.log('Could not get study addresses from DB:', err);
        return Boom.notFound(String(err));
      });
  };
}
