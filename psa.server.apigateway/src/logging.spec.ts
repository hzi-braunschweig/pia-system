/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { Logging } from './logging';
import { StatusCode } from './statusCode';

describe('Logging', () => {
  it('colorizeStatus should keep status', () => {
    for (let i = 0; i < StatusCode.MAX; i++) {
      expect(Logging.colorizeStatus(i)).to.contain(i.toString());
    }
  });
});
