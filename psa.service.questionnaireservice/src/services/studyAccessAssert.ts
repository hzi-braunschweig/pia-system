/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AccessToken } from '@pia/lib-service-core';
import Boom from '@hapi/boom';

export function assertStudyAccess(
  studyId: string,
  decodedToken: AccessToken
): void {
  if (!decodedToken.groups.includes(studyId)) {
    throw Boom.forbidden('user has no access to study');
  }
}
