/*
 * SPDX-FileCopyrightText: 2004 Red Hat, Inc. and/or its affiliates and other contributors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 * This file is based on the original keycloak-js adapter. Changes include:
 *  - use TypeScript instead of JavaScript
 *  - no fallback for browsers without LocalStorage
 */

import { OAuthState } from './keycloak.model';

export class CallbackStorage {
  public getOAuthState(state: string): OAuthState | undefined {
    if (!state) {
      return;
    }

    const key = 'kc-callback-' + state;
    const item = localStorage.getItem(key);
    let value: OAuthState;

    if (item) {
      localStorage.removeItem(key);
      value = JSON.parse(item) as OAuthState;
    }

    this.clearExpired();
    return value;
  }

  private clearExpired(): void {
    const time = new Date().getTime();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.indexOf('kc-callback-') == 0) {
        const value = localStorage.getItem(key);

        if (value) {
          try {
            const expires = JSON.parse(value).expires;
            if (!expires || expires < time) {
              localStorage.removeItem(key);
            }
          } catch (err) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}
