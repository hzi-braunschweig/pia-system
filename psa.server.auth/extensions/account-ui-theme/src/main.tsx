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

import '@patternfly/react-core/dist/styles/base.css';

import { KeycloakProvider } from '@keycloak/keycloak-account-ui';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { environment } from './environment';
import { i18n } from './i18n';
import { routes } from './routes';

const router = createBrowserRouter(routes);

i18n.init().then(() => {
  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
      <KeycloakProvider environment={environment}>
        <RouterProvider router={router} />
      </KeycloakProvider>
    </React.StrictMode>
  );
});
