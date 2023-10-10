/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChartsConfiguration } from './models';

export const defaultConfiguration: ChartsConfiguration = {
  legend: {
    position: 'bottom',
    align: 'center',
  },
  tooltip: {
    enabled: false,
  },
};
