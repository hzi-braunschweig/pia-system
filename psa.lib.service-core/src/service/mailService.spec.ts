/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import { createSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import { MailService } from './mailService';
import nodemailer, { Transporter } from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';
import { MailserverConnection } from '../config/configModel';

chai.use(sinonChai);
const expect = chai.expect;
const sandbox = createSandbox();

describe('MailService', () => {
  let sendMailStub: SinonStub;
  let createTransportStub: SinonStub;
  const mailServerConfig: MailserverConnection = {
    host: 'MAIL_HOST',
    port: 80,
    user: 'MAIL_USER',
    password: 'MAIL_PASSWORD',
    requireTLS: false,
    from: 'noreply@piatest.doesnotexist',
    name: 'PIA',
  };

  beforeEach(() => {
    sendMailStub = sandbox.stub().callsFake((mailOptions: Options) => ({
      accepted: [mailOptions.to],
    }));
    const transporter: Partial<Transporter> = {
      sendMail: sendMailStub,
    };
    createTransportStub = sandbox
      .stub(nodemailer, 'createTransport')
      .returns(transporter as Transporter);
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('initService()', () => {
    it('should init the mail transporter', () => {
      // Arrange

      // Act
      MailService.initService(mailServerConfig);

      // Assert
      expect(createTransportStub).to.be.calledOnce;
    });
  });

  describe('sendMail()', () => {
    beforeEach(() => {
      MailService.initService(mailServerConfig);
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
      await MailService.sendMail(recipient, email);

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
        html: '<p>some content</p><a id=x onclick=alert(1)//>',
      };

      // Act
      await MailService.sendMail(recipient, email);

      // Assert
      expect(sendMailStub).to.be.calledWithExactly({
        to: 'sometest@mail.doesnotexist',
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p><a id="x"></a>',
      });
    });
  });
});
