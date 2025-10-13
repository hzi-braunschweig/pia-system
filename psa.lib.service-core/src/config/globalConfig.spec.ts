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

  describe('getNotificationTime()', () => {
    it('should return default values when environment variables are not set', () => {
      delete process.env['NOTIFICATION_HOUR'];
      delete process.env['NOTIFICATION_MINUTE'];
      expect(GlobalConfig.getNotificationTime()).to.deep.equal({
        hours: 8,
        minutes: 0,
      });
    });

    it('should return values from environment variables when set', () => {
      process.env['NOTIFICATION_HOUR'] = '14';
      process.env['NOTIFICATION_MINUTE'] = '30';
      expect(GlobalConfig.getNotificationTime()).to.deep.equal({
        hours: 14,
        minutes: 30,
      });
    });

    it('should handle partial environment variable configuration', () => {
      process.env['NOTIFICATION_HOUR'] = '9';
      delete process.env['NOTIFICATION_MINUTE'];
      expect(GlobalConfig.getNotificationTime()).to.deep.equal({
        hours: 9,
        minutes: 0,
      });
    });

    it('should handle zero values', () => {
      process.env['NOTIFICATION_HOUR'] = '0';
      process.env['NOTIFICATION_MINUTE'] = '0';
      expect(GlobalConfig.getNotificationTime()).to.deep.equal({
        hours: 0,
        minutes: 0,
      });
    });
  });
});
