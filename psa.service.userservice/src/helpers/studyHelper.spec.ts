/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { hasExistingPseudonymPrefix } from './studyHelper';
import { config } from '../config';

const sandbox = sinon.createSandbox();

describe('StudyHelper', function () {
  before(() => {
    sandbox.stub(config, 'probandAppUrl').value('https://pia-app/');
  });
  after(() => {
    sandbox.restore();
  });

  it('should return true if prefix exists', function () {
    const result = hasExistingPseudonymPrefix('LOCAL');
    expect(result).to.be.true;
  });

  it('should return false if prefix does not exist', function () {
    const result = hasExistingPseudonymPrefix('nothing');
    expect(result).to.be.false;
  });

  it('should trim trailing dashes', function () {
    const result = hasExistingPseudonymPrefix('LOCAL-');
    expect(result).to.be.true;
  });

  it('should return true if prefix is DEV and it is a development system', () => {
    sandbox.stub(config, 'probandAppUrl').value('https://some-odd-url');
    sandbox.stub(config, 'isDevelopmentSystem').value(true);
    const result = hasExistingPseudonymPrefix('DEV');
    expect(result).to.be.true;
  });
});
