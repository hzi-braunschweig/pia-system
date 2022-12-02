/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import variableNameGenerator from './variableNameGenerator';
import { expect } from 'chai';

describe('variableNameGenerator', () => {
  const variableNameLength = 2;
  const possibleCountNames = 100;
  const unavailableNames = Array(possibleCountNames)
    .fill(1)
    .map((_, i) => 'auto-' + String(i++).padStart(variableNameLength, '0'));

  it('should throw an error if after 100 tries no unique variable name could be generated', () => {
    expect(() => {
      variableNameGenerator(variableNameLength, unavailableNames);
    }).to.throw(
      'it seems that all possible variable names have been assigned (tried it 100 times)'
    );
  });
});
