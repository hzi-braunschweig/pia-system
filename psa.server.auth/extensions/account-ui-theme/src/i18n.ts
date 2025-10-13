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
 */

import { LanguageDetectorModule, createInstance } from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { environment } from './environment';

type KeyValue = { key: string; value: string };

export const keycloakLanguageDetector: LanguageDetectorModule = {
  type: 'languageDetector',

  detect() {
    return environment.locale;
  },
};

export const i18n = createInstance({
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  backend: {
    loadPath: `${environment.serverBaseUrl}/resources/${environment.realm}/account/{{lng}}`,
    parse: (data: string) => {
      const messages = JSON.parse(data);

      const result: Record<string, string> = {};
      messages.forEach((v: KeyValue) => (result[v.key] = v.value));
      return result;
    },
  },
});

i18n.use(HttpBackend);
i18n.use(keycloakLanguageDetector);
i18n.use(initReactI18next);
