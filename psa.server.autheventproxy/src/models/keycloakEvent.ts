/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

type KeycloakEventType = 'LOGIN'; // add additional types as necessary

export interface KeycloakGenericEvent {
  '@class': string;
  time: number;
  type: KeycloakEventType;
  realmId: string;
  clientId: string;
  userId: string;
  sessionId: string;
  ipAddress: string;
  details: Record<string, string>;
}

export interface KeycloakLoginEvent extends KeycloakGenericEvent {
  details: {
    auth_method: string;
    auth_type: string;
    response_type: string;
    redirect_uri: string;
    consent: string;
    code_id: string;
    username: string;
    response_mode: string;
  };
}
