/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import { expect } from 'chai';
import { createReadStream } from 'fs';
import { StreamTimeout } from './streamTimeout';
import { rm, writeFile } from 'fs/promises';

describe('StreamTimeout', () => {
  const timeout = 200;
  const streamDuration = 1000;
  const largeTestFile = 'large-test.txt';
  const smallTestFile = 'small-test.txt';

  before(async () => {
    await writeFile(largeTestFile, 'test'.repeat(10000000));
    await writeFile(smallTestFile, 'test'.repeat(100));
  });

  after(async () => {
    await rm(largeTestFile);
    await rm(smallTestFile);
  });

  it('should close the stream after a given timeout', (done) => {
    // Arrange
    const start = Date.now();
    const streamTimeout = new StreamTimeout(timeout);

    // Act
    const stream = createReadStream(largeTestFile).pipe(streamTimeout);

    // Assert
    stream.once('close', () => {
      expect(Date.now() - start).to.be.greaterThanOrEqual(timeout);
      expect(Date.now() - start).to.be.lessThan(streamDuration);
      done();
    });
  });

  it('should not close the stream before the timeout', (done) => {
    // Arrange
    const start = Date.now();
    let streamClosed = false;
    const streamTimeout = new StreamTimeout(timeout);

    // Act
    createReadStream(largeTestFile)
      .pipe(streamTimeout)
      .once('close', () => (streamClosed = true));

    // Assert
    setTimeout(() => {
      console.log('timeout after', Date.now() - start, 'ms');
      expect(streamClosed).to.be.false;
      done();
    }, 100);
  });

  it('should pass through the data', (done) => {
    // Arrange
    const streamTimeout = new StreamTimeout(timeout);
    let fileContent = '';

    // Act
    const stream = createReadStream(smallTestFile)
      .pipe(streamTimeout)
      .on('data', (chunk: Buffer) => (fileContent += chunk.toString()));

    // Assert
    stream.once('close', () => {
      expect(fileContent).to.equal('test'.repeat(100));
      done();
    });
  });
});
