/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { Logging } from './logging';

describe('Logging', () => {
  it('colorizeStatus should keep status', () => {
    const statusCodeMax = 999;
    for (let i = 0; i < statusCodeMax; i++) {
      expect(Logging.colorizeStatus(i)).to.contain(i.toString());
    }
  });
});
