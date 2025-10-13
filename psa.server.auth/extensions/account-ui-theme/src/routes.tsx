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
 * ---
 *
 * This file has been modified:
 *  - remove routes that are not needed/wanted in PIA
 */

import { type RouteObject } from 'react-router-dom';
import App from './App';
import { environment } from './environment';
import { DeviceActivity, SigningIn } from '@keycloak/keycloak-account-ui';

export const DeviceActivityRoute: RouteObject = {
  path: 'account-security/deviceActivity',
  element: <DeviceActivity />,
};
export const SigningInRoute: RouteObject = {
  path: 'account-security/signingIn',
  element: <SigningIn />,
};

const DefaultRoute: RouteObject = {
  path: '',
  element: <SigningIn />,
};

export const RootRoute: RouteObject = {
  path: decodeURIComponent(new URL(environment.baseUrl).pathname),
  element: <App />,
  errorElement: <>Error</>,
  children: [DefaultRoute, DeviceActivityRoute, SigningInRoute],
};

export const routes: RouteObject[] = [RootRoute];
