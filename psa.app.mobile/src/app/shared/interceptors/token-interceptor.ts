/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { from, mergeMap, Observable } from 'rxjs';
import { KeycloakClientService } from 'src/app/auth/keycloak-client.service';
import {
  addAuthorizationHeader,
  conditionallyUpdateToken,
} from 'keycloak-angular';

/**
 * Adds the bearer token to requests
 */
export const tokenInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const keycloakClientService = inject(KeycloakClientService);
  const keycloak = keycloakClientService.keycloak;
  if (!keycloak) {
    return next(req);
  }

  return from(conditionallyUpdateToken(req, keycloak, {})).pipe(
    mergeMap(() => {
      return keycloak.authenticated
        ? addAuthorizationHeader(req, next, keycloak, {})
        : next(req);
    })
  );
};
