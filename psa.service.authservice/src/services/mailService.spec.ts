/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import { createSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import { config } from '../config';
import mailService from './mailService';
import nodemailer, { Transporter } from 'nodemailer';
import { mock } from 'ts-mockito';

chai.use(sinonChai);
const expect = chai.expect;
const sandbox = createSandbox();

describe('MailService', () => {
  let sendMailStub: SinonStub;
  let createTransportStub: SinonStub;
  const transporter = mock<Transporter>();

  beforeEach(() => {
    sandbox.stub(config.servers, 'mailserver').value({
      host: 'MAIL_HOST',
      port: '80',
      user: 'MAIL_USER',
      password: 'MAIL_PASSWORD',
      requireTLS: false,
      from: 'noreply@piatest.doesnotexist',
      name: 'PIA',
    });
    sendMailStub = sandbox.stub().resolves();
    transporter.sendMail = sendMailStub;
    createTransportStub = sandbox
      .stub(nodemailer, 'createTransport')
      .returns(transporter);
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('initService()', () => {
    it('should init the mail transporter', () => {
      // Arrange

      // Act
      mailService.initService();

      // Assert
      expect(createTransportStub).to.be.calledOnce;
    });
  });

  describe('sendMail()', () => {
    beforeEach(() => {
      mailService.initService();
    });

    it('should send a mail to the specified recipient', async () => {
      // Arrange
      const recipient = 'sometest@mail.doesnotexist';
      const email = {
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p>',
      };

      // Act
      await mailService.sendMail(recipient, email);

      // Assert
      expect(sendMailStub).to.be.calledOnce;
      expect(sendMailStub).to.be.calledWithExactly({
        to: 'sometest@mail.doesnotexist',
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p>',
      });
    });

    it('should sanitize html content', async () => {
      // Arrange
      const recipient = 'sometest@mail.doesnotexist';
      const email = {
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p><img src=x onerror=alert(1)//>',
      };

      // Act
      await mailService.sendMail(recipient, email);

      // Assert
      expect(sendMailStub).to.be.calledWithExactly({
        to: 'sometest@mail.doesnotexist',
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p><img src="x">',
      });
    });
  });
});
