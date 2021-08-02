/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthCredentials, Request } from '@hapi/hapi';

export interface BasicValidationFn {
  (request: Request, username: string, password: string): ValidationResult;
}

export interface TokenValidationFn<T extends AuthToken> {
  (decoded: T): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  credentials?: {
    name: string;
  };
}

type AccessTokenId = 1;
type LoginTokenId = 2;

/**
 * Used to access the application APIs
 */
export interface AccessToken extends AuthToken {
  id: AccessTokenId;
  role: string;
  groups: string[];
}

/**
 * Only used to exchange for AccessToken
 */
export interface LoginToken extends AuthToken {
  id: LoginTokenId;
}

export interface AuthToken extends AuthCredentials {
  id: AccessTokenId | LoginTokenId;
  username: string;
}

export const ACCESS_TOKEN_ID = 1;
export const LOGIN_TOKEN_ID = 2;

export function isAccessToken(token: AuthToken): token is AccessToken {
  return !!token.username && token.id === ACCESS_TOKEN_ID;
}

export function isLoginToken(token: AuthToken): token is LoginToken {
  return !!token.username && token.id === LOGIN_TOKEN_ID;
}
