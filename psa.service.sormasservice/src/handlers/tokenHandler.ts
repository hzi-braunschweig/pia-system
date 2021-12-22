/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { TokenInteractor } from '../interactors/tokenInteractor';

interface RequestTokenPayload {
  email: string;
  password: string;
}

export interface RequestTokenResponseSuccess {
  success: true;
  userId: string;
  token: string;
}

export interface RequestTokeResponseFailure {
  success: false;
}

export type RequestTokenResponse =
  | RequestTokenResponseSuccess
  | RequestTokeResponseFailure;

export class TokenHandler {
  /**
   * @function
   * @description Generates and retrieves the token
   */
  public static requestToken: Lifecycle.Method = async (request) => {
    const { email, password } = request.payload as RequestTokenPayload;

    const token = await TokenInteractor.requestToken(email, password);
    let response: RequestTokenResponse;
    if (!token) {
      response = {
        success: false,
      };
    } else {
      response = {
        success: true,
        token,
        userId: email,
      };
    }
    return response;
  };
}
