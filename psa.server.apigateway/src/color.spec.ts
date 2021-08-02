/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { Color } from './color';

describe('Color', () => {
  it('bool', () => {
    expect(Color.bool(true)).to.contain('true');
    expect(Color.bool(false)).to.contain('false');
  });

  it('contains input str', () => {
    const str = 'test';
    expect(Color.warn(str)).to.contain(str);
    expect(Color.error(str)).to.contain(str);
    expect(Color.info(str)).to.contain(str);
    expect(Color.serviceName(str)).to.contain(str);
    expect(Color.success(str)).to.contain(str);
    expect(Color.route(str)).to.contain(str);
    expect(Color.protocol(str)).to.contain(str);
  });
});
