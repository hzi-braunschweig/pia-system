/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai';
import generateCustomName from './generateCustomName';

describe('generateCustomName', () => {
  const testCases: [[string, number], string][] = [
    [['Simple Name', 12], 'SimpleName-12'],
    [['Hello World?', 54], 'HelloWorld-54'],
    [['PIA This Name', 7], 'PiaThisNam-7'],
    [['Supercalifragilisticexpialigetisch', 13], 'Supercalif-13'],
    [['Foo: * (in)! _bar_?', 6754], 'FooInBar-6754'],
  ];

  for (const testCase of testCases) {
    it(`should return ${testCase[1]} when arguments are "${testCase[0][0]}", ${testCase[0][1]}`, () => {
      expect(generateCustomName(...testCase[0])).to.equal(testCase[1]);
    });
  }
});
