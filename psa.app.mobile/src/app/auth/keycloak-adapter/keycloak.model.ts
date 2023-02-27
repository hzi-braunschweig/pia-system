/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface OAuthParams {
  code: string;
  error: string;
  state: string;
  newUrl: string;

  valid?: boolean;
  redirectUri?: string;
  storedNonce?: string;
  prompt?: string;
  pkceCodeVerifier?: string;

  error_description?: string;
}

export interface OAuthState {
  redirectUri: string;
  nonce: string;
  prompt: string;
  pkceCodeVerifier: string;
  expires?: number;
}

export interface OAuthAccessToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}
