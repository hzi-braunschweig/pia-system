/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { InjectionToken } from '@angular/core';
import { ChartsConfiguration } from './models';

export const PIA_CHARTS_CONFIGURATION = new InjectionToken<ChartsConfiguration>(
  'PIA_CHARTS_CONFIGURATION'
);
