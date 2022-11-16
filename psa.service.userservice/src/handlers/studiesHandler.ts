/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle, Request } from '@hapi/hapi';

import { AccessToken } from '@pia/lib-service-core';
import { StudiesInteractor } from '../interactors/studiesInteractor';
import { Study } from '../models/study';
import { StudyWelcomeMailTemplateRequestDto } from '../models/studyWelcomeEmail';

export class StudiesHandler {
  /**
   * @description gets the study if the user has access
   */
  public static getOne: Lifecycle.Method = async (request: Request) => {
    return await StudiesInteractor.getStudy(
      request.params['studyName'] as string
    );
  };

  /**
   * @description get all studies the user has access to
   */
  public static getAll: Lifecycle.Method = async (request: Request) => {
    return await StudiesInteractor.getStudies(
      request.auth.credentials as AccessToken
    );
  };

  /**
   * @description creates the study if the user has access
   */
  public static createOne: Lifecycle.Method = async (request: Request) => {
    return await StudiesInteractor.createStudy(request.payload as Study);
  };

  /**
   * @description updates the study if the user has access
   */
  public static updateOne: Lifecycle.Method = async (request: Request) => {
    return await StudiesInteractor.updateStudy(
      request.params['studyName'] as string,
      request.payload as Study
    );
  };

  /**
   * @description updates the study welcome text if the user has access
   */
  public static updateStudyWelcomeText: Lifecycle.Method = async (
    request: Request
  ) => {
    return await StudiesInteractor.updateStudyWelcomeText(
      request.params['studyName'] as string,
      (request.payload as { welcome_text: string }).welcome_text
    );
  };

  /**
   * @description gets the study welcome text if the user has access
   */
  public static getStudyWelcomeText: Lifecycle.Method = async (
    request: Request
  ) => {
    return await StudiesInteractor.getStudyWelcomeText(
      request.params['studyName'] as string
    );
  };

  /**
   * @description updates the study welcome mail content
   */
  public static updateStudyWelcomeMail: Lifecycle.Method = async (
    request: Request
  ) => {
    return await StudiesInteractor.updateStudyWelcomeMail(
      request.params['studyName'] as string,
      request.payload as StudyWelcomeMailTemplateRequestDto
    );
  };

  /**
   * @description gets the study welcome mail content
   */
  public static getStudyWelcomeMail: Lifecycle.Method = async (
    request: Request
  ) => {
    return await StudiesInteractor.getStudyWelcomeMail(
      request.params['studyName'] as string
    );
  };
}
