/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { ExecutionTime } from './executionTime';
import util from 'util';

describe('ExecutionTime', () => {
  const sleep = util.promisify(setTimeout);

  it('should calculate the execution time', async () => {
    // Arrange
    const start = new Date();
    const sleepDuration = 30;

    // Act
    const executionTime = new ExecutionTime();
    await sleep(sleepDuration);

    // Assert
    const duration = new Date().getTime() - start.getTime();
    expect(executionTime.get()).to.be.approximately(duration, 1);
  });

  it('should return a string describing the execution time', async () => {
    // Arrange
    const sleepDuration = 30;

    // Act
    const executionTime = new ExecutionTime();
    await sleep(sleepDuration);

    // Assert
    expect(executionTime.toString()).to.match(/^\(took [3-9]\d ms\)$/);
  });
});
