/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { KeycloakPromise } from 'keycloak-js';
import { Observable, take } from 'rxjs';

/**
 * TypeScript implementation of the KeycloakPromise interface used by the
 * keycloak-js adapter.
 */
export class KeycloakPromiseImpl<TSuccess, TError>
  extends Promise<TSuccess>
  implements KeycloakPromise<TSuccess, TError>
{
  public static fromObservable<S, E>(
    observable: Observable<S>
  ): KeycloakPromise<S, E> {
    return new KeycloakPromiseImpl((resolve, reject) =>
      observable.pipe(take(1)).subscribe(resolve, reject)
    );
  }

  public static resolve<S, E>(
    value?: S | PromiseLike<S>
  ): KeycloakPromise<S, E> {
    return new KeycloakPromiseImpl((resolve) => resolve(value));
  }

  public static reject<S, E>(
    value?: S | PromiseLike<S>
  ): KeycloakPromise<S, E> {
    return new KeycloakPromiseImpl((_, reject) => reject(value));
  }

  constructor(
    executor: (
      resolve: (value: TSuccess | PromiseLike<TSuccess>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  public success(
    callback: (success: TSuccess) => void
  ): KeycloakPromise<TSuccess, TError> {
    this.then((value) => callback(value));
    return this;
  }

  public error(
    callback: (error: TError) => void
  ): KeycloakPromise<TSuccess, TError> {
    this.catch((error) => callback(error));
    return this;
  }
}
