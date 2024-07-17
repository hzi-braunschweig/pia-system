/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint @typescript-eslint/no-magic-numbers: 0 */

import { expect } from 'chai';
import util from 'util';
import { asyncMapParallel } from './async';

describe('Async', () => {
  const sleep = util.promisify(setTimeout);

  describe('asyncMapParallel', () => {
    it('should map to the correct values with delay', async () => {
      const values = Array.from(Array(20).keys());

      const result = await asyncMapParallel(
        values,
        async (entry) => {
          await sleep(20 - entry);
          return entry;
        },
        5
      );

      expect(result).to.deep.equal(values);
    });

    it('should map to the correct values with high parallism', async () => {
      const values = Array.from(Array(20).keys());

      const result = await asyncMapParallel(
        values,
        async (entry) => {
          await sleep(20 - entry);
          return entry;
        },
        100
      );

      expect(result).to.deep.equal(values);
    });

    it('should map to the correct values with low parallism', async () => {
      const values = Array.from(Array(20).keys());

      const result = await asyncMapParallel(
        values,
        async (entry) => {
          await sleep(20 - entry);
          return entry;
        },
        2
      );

      expect(result).to.deep.equal(values);
    });

    // this test could contain races that are probably very unlikely
    // remove the test if it seems to be flaky
    // if it fails reproducibly: dig deeper
    it('should respect the max parallelism limit', async () => {
      const values = Array.from(Array(20).keys());
      const maxParallel = 3;
      let runningTasks = 0;
      let maxConcurrentTasks = 0;

      const result = await asyncMapParallel(
        values,
        async (entry) => {
          runningTasks++;
          maxConcurrentTasks = Math.max(maxConcurrentTasks, runningTasks);
          await sleep(20 - entry);
          runningTasks--;
          return entry;
        },
        maxParallel
      );

      expect(result).to.deep.equal(values);
      expect(maxConcurrentTasks).to.equal(maxParallel);
    });
  });
});
