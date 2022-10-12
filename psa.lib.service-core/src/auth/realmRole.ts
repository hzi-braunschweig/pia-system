/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthCredentials } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';

import { SpecificError } from '../plugins/errorHandler';

export type ProbandRealmRole = 'Proband';
export type AdminRealmRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam'
  | 'SysAdmin';
export type RealmRole = AdminRealmRole | ProbandRealmRole;

/**
 * Realm roles are prefixed with "realm:" by the
 * underlying keycloak auth nodejs lib. This prefix
 * can be used to differentiate between realm roles
 * and all other roles. In PIA it is not further used.
 */
const realmRolePrefix = 'realm:';

/**
 * Realm roles may be specialized by certain access types
 * like "admin". Those specializations are appended to
 * the primary role name with this character.
 */
const realmRoleSpecializationSeparatorChar = '-';

/**
 * Realm roles may also give users access to certain features.
 * Those roles are prefixed with "feature:".
 */
const realmRoleFeaturePrefix = 'feature:';

export class MissingPermissionError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'MISSING_PERMISSION';
}

/**
 * Returns a list of all realm roles which can be found within
 * the auth credentials
 *
 * Throws if no auth scope is defined.
 */
export function getRealmRoles(authCredentials: AuthCredentials): RealmRole[] {
  if (!Array.isArray(authCredentials.scope)) {
    throw new MissingPermissionError(
      'Missing permission error: auth credentials scope is undefined'
    );
  }
  return authCredentials.scope
    .filter((scope) => scope.startsWith(realmRolePrefix))
    .map((scope) => scope.slice(realmRolePrefix.length) as RealmRole);
}

/**
 * Returns the primary realm role against which permissions are
 * commonly checked
 *
 * This role is found via the absence of the realm role specialization
 * separator character. Throws if no auth scope is defined.
 */
export function getPrimaryRealmRole(
  authCredentials: AuthCredentials
): RealmRole {
  const primaryRole = getRealmRoles(authCredentials).find(
    (role) =>
      !role.includes(realmRoleSpecializationSeparatorChar) &&
      !role.includes(realmRoleFeaturePrefix)
  );
  if (!primaryRole) {
    throw new MissingPermissionError(
      'Missing permission error: user has no primary role'
    );
  }
  return primaryRole;
}

/**
 * Checks whether the AuthCredentials contain the expected role
 *
 * Throws if no auth scope is defined.
 */
export function hasRealmRole(
  expectedRole: RealmRole,
  authCredentials: AuthCredentials
): boolean {
  return getRealmRoles(authCredentials).includes(expectedRole);
}
