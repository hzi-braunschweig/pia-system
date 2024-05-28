/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EventProxy } from './proxys/eventProxy';
import { LoginWebAppProxy } from './proxys/loginWebAppProxy';
import { LoginMobileAppProxy } from './proxys/loginMobileAppProxy';
import { UserRegistrationProxy } from './proxys/userRegistrationProxy';
import { ProbandEmailVerifiedProxy } from './proxys/probandEmailVerifiedProxy';

export const proxies: typeof EventProxy[] = [
  LoginWebAppProxy,
  LoginMobileAppProxy,
  UserRegistrationProxy,
  ProbandEmailVerifiedProxy,
];
