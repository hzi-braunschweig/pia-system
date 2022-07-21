/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle, Request } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { RESTPresenter } from '../services/RESTPresenter';
import { StudiesInteractor } from '../interactors/studiesInteractor';

/**
 * @deprecated remaining proband API routes will be moved to the userservice in the future
 * @see https://confluence.sormas-tools.de/pages/viewpage.action?pageId=12978804
 */
export class StudiesHandler {
  /**
   * @description gets the study if the proband has access
   */
  public static getOne: Lifecycle.Method = async (request: Request) => {
    const study = await StudiesInteractor.getStudy(
      request.auth.credentials as AccessToken,
      request.params['studyName'] as string
    );
    return RESTPresenter.presentStudy(study);
  };

  /**
   * @description gets the study welcome text if the proband has access
   */
  public static getStudyWelcomeText: Lifecycle.Method = async (
    request: Request
  ) => {
    const welcomeText = await StudiesInteractor.getStudyWelcomeText(
      request.params['studyName'] as string
    );
    return RESTPresenter.presentStudyWelcomeText(welcomeText);
  };

  /**
   * @description gets the study access if the proband has access
   */
  public static getStudyAddresses: Lifecycle.Method = async (
    request: Request
  ) => {
    return StudiesInteractor.getStudyAddresses(
      request.auth.credentials as AccessToken
    );
  };
}
