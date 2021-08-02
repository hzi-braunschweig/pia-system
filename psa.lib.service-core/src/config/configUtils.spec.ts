/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { ConfigUtils } from './configUtils';

describe('ConfigUtils', () => {
  const processEnvCopy = { ...process.env };

  after(() => {
    process.env = processEnvCopy;
  });

  describe('getEnvVariable()', () => {
    it('should return the env value', () => {
      process.env['TEST_ENV'] = 'test';
      expect(ConfigUtils.getEnvVariable('TEST_ENV')).to.eq('test');
    });

    it('should return a fallback value for missing envs', () => {
      expect(ConfigUtils.getEnvVariable('MISSING', 'fallback')).to.eq(
        'fallback'
      );
    });

    it('should throw an error if a missing env was requested without fallback', () => {
      expect(() => ConfigUtils.getEnvVariable('MISSING')).to.throw;
    });

    it('should return an empty string for missing envs and IGNORE_MISSING_CONFIG === 1', () => {
      process.env['IGNORE_MISSING_CONFIG'] = '1';
      expect(ConfigUtils.getEnvVariable('MISSING')).to.eq('');
    });
  });

  describe('getFileContent()', () => {
    it('should throw if no file was found', () => {
      expect(() => ConfigUtils.getFileContent('path/does/not/exist')).to.throw;
    });

    it('should return an empty Buffer for missing files', () => {
      process.env['IGNORE_MISSING_CONFIG'] = '1';
      const result = ConfigUtils.getFileContent('path/does/not/exist');
      expect(Buffer.isBuffer(result)).to.be.true;
      expect(result).to.have.length(0);
    });
  });
});
