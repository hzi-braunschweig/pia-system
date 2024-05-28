/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { GlobalConfig } from './globalConfig';

describe('GlobalConfig', () => {
  const processEnvCopy = { ...process.env };

  beforeEach(() => {
    process.env = processEnvCopy;
  });

  after(() => {
    process.env = processEnvCopy;
  });

  describe('getPublic()', () => {
    it('should return the port from env', () => {
      process.env['PORT'] = '12345';
      process.env['SPECIFICSERVICE_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(GlobalConfig.getPublic('')).to.deep.equal({
        host: '0.0.0.0',
        port: 12345,
      });
    });

    it('should prefer the service specific port from env over the generic one', () => {
      process.env['PORT'] = '12345';
      process.env['SPECIFICSERVICE_PORT'] = '6789';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(GlobalConfig.getPublic('specificservice')).to.deep.equal({
        host: '0.0.0.0',
        port: 6789,
      });
    });

    it('should throw an error if port env is not specified and IGNORE_MISSING_CONFIG is not set', () => {
      process.env['PORT'] = '';
      process.env['SPECIFICSERVICE_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(() => GlobalConfig.getPublic('specificservice')).to.throw(
        "config variable 'PORT' is not a valid number ''"
      );
    });

    it('should return 0 if port env is not specified but IGNORE_MISSING_CONFIG is set', () => {
      process.env['PORT'] = '';
      process.env['SPECIFICSERVICE_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '1';
      expect(GlobalConfig.getPublic('specificservice')).to.deep.equal({
        host: '0.0.0.0',
        port: 0,
      });
    });
  });

  describe('getInternal()', () => {
    it('should return the port from env', () => {
      process.env['INTERNAL_PORT'] = '12345';
      process.env['SPECIFICSERVICE_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(GlobalConfig.getInternal('')).to.deep.equal({
        host: '0.0.0.0',
        port: 12345,
      });
    });

    it('should prefer the service specific port from env over the generic one', () => {
      process.env['INTERNAL_PORT'] = '12345';
      process.env['SPECIFICSERVICE_INTERNAL_PORT'] = '6789';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(GlobalConfig.getInternal('specificservice')).to.deep.equal({
        host: '0.0.0.0',
        port: 6789,
      });
    });

    it('should throw an error if port env is not specified and IGNORE_MISSING_CONFIG is not set', () => {
      process.env['INTERNAL_PORT'] = '';
      process.env['SPECIFICSERVICE_INTERNAL_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '';
      expect(() => GlobalConfig.getInternal('specificservice')).to.throw(
        "config variable 'INTERNAL_PORT' is not a valid number ''"
      );
    });

    it('should return 0 if port env is not specified but IGNORE_MISSING_CONFIG is set', () => {
      process.env['INTERNAL_PORT'] = '';
      process.env['SPECIFICSERVICE_INTERNAL_PORT'] = '';
      process.env['IGNORE_MISSING_CONFIG'] = '1';
      expect(GlobalConfig.getInternal('specificservice')).to.deep.equal({
        host: '0.0.0.0',
        port: 0,
      });
    });
  });
});
