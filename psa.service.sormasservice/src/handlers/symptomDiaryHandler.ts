/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SymptomDiaryInteractor } from '../interactors/symptomDiaryInteractor';
import { Lifecycle } from '@hapi/hapi';
import { validateOneTimeTokenAuth } from '../auth/strategies/validateOneTimeToken';
import Boom from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';
import { ViewProbandModel } from '../models/symptomDiary';

interface DefaultEmailValidationResponse {
  total: 0;
  count: 0;
  results: [];
}

export class SymptomDiaryHandler {
  /**
   * Pseudo email validation to be compatible with API expected by SORMAS
   */
  public static getEmailValidation: Lifecycle.Method = () => {
    const response: DefaultEmailValidationResponse = {
      total: 0,
      count: 0,
      results: [],
    };
    return response;
  };

  public static getProband: Lifecycle.Method = async (request, h) => {
    const token = request.query['token'] as string;
    if (!(await validateOneTimeTokenAuth(token))) {
      throw Boom.unauthorized('No authorization token provided');
    }
    const personUuid = request.query['q'] as string;

    let data: ViewProbandModel;
    try {
      data = await SymptomDiaryInteractor.getProbandViewData(personUuid);
    } catch (e) {
      console.warn(e);
      return h
        .view('symptomdiary-proband-not-found.ejs', {
          translate: request.plugins.i18n,
        })
        .code(StatusCodes.NOT_FOUND);
    }

    return h.view('symptomdiary-proband.ejs', {
      translate: request.plugins.i18n,
      data,
    });
  };

  public static postProband: Lifecycle.Method = async (request) => {
    return SymptomDiaryInteractor.registerProband(
      request.params['personUuid'] as string,
      request.plugins.i18n
    );
  };

  public static putProband: Lifecycle.Method = async (request) => {
    return SymptomDiaryInteractor.updateProband(
      request.params['personUuid'] as string,
      request.plugins.i18n
    );
  };

  public static deactivateProband: Lifecycle.Method = async (request) => {
    return SymptomDiaryInteractor.deactivateProband(
      request.params['personUuid'] as string,
      request.plugins.i18n
    );
  };
}
