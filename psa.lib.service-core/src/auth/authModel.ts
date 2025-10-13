/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthCredentials, MergeType } from '@hapi/hapi';

export interface CredentialsExtra {
  username: string;
  studies: string[];
  locale: string;
}

/**
 * The decoded credentials of a token, filled by the hapi keycloak plugin.
 */
export type RequestAuthCredentials = MergeType<
  CredentialsExtra,
  AuthCredentials
>;

/**
 * @deprecated use RequestAuthCredentials instead which is explicitly typed, without a record signature
 */
export type AccessToken = Record<string, unknown> &
  MergeType<CredentialsExtra, AuthCredentials>;
