/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox, SinonSpy } from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import { LoggingService } from './loggingService';

chai.use(sinonChai);
const expect = chai.expect;
const sandbox = createSandbox();

describe('LoggingService', () => {
  const logger = new LoggingService('TestService');

  let infoStub: SinonSpy;
  let warnStub: SinonSpy;
  let errorStub: SinonSpy;

  beforeEach(() => {
    infoStub = sandbox.spy(console, 'info');
    warnStub = sandbox.spy(console, 'warn');
    errorStub = sandbox.spy(console, 'error');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('info()', () => {
    it('should log with level info and prepend log level symbol and scope', () => {
      // Arrange

      // Act
      logger.info('This is the message');

      // Assert
      expect(infoStub).to.have.been.calledWith(
        '(ℹ️) TestService: This is the message'
      );
    });
  });

  describe('warn()', () => {
    it('should log with level warn and prepend log level symbol and scope', () => {
      // Arrange

      // Act
      logger.warn('This is the warning');

      // Assert
      expect(warnStub).to.have.been.calledWith(
        '(⚠️) TestService: This is the warning'
      );
    });
  });

  describe('error()', () => {
    it('should log with level error and prepend log level symbol and scope', () => {
      // Arrange

      // Act
      logger.error('This is the error');

      // Assert
      expect(errorStub).to.have.been.calledWith(
        '(❌️) TestService: This is the error'
      );
    });
  });

  describe('printQuestionnaire()', () => {
    it('should return string with questionnaire name, id and version', () => {
      // Arrange
      const questionnaire = {
        name: 'Test Questionnaire',
        id: 33,
        version: 2,
      };

      // Act
      const result = logger.printQuestionnaire(questionnaire);

      // Assert
      expect(result).to.eql('"Test Questionnaire" (#33 v2)');
    });
  });
});
