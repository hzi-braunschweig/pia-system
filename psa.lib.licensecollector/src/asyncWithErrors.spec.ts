/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import sinon from 'sinon';

import { asyncPassErrors } from './asyncWithErrors';
import { CommandOptions } from './cli';

describe('asyncWithErrors', () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  it('should set exit code to 1 on errors', async () => {
    const exitStub = sandbox.stub(process, 'exit');

    await asyncPassErrors(() => {
      throw new Error('license is missing');
    })('root', createCommandOptions());

    expect(exitStub.calledWith(1)).to.be.true;
  });

  function createCommandOptions(): CommandOptions {
    return {
      target: 'sometarget',
      onlyProduction: false,
      assertValidLicenseTexts: true,
      format: 'text',
      addDocker: false,
    };
  }
});
