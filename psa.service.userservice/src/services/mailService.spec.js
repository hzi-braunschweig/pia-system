const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');

describe('MailService', () => {
  let mailService;
  let sendMailStub;
  let createTransportStub;

  beforeEach(() => {
    sendMailStub = sinon.stub().resolves();
    createTransportStub = sinon.stub().returns({ sendMail: sendMailStub });

    mailService = proxyquire('./mailService', {
      nodemailer: { createTransport: createTransportStub },
      '../config': getConfig(),
    });
  });

  describe('initService()', () => {
    it('should init the mail transporter', () => {
      // Arrange

      // Act
      mailService.initService();

      // Assert
      expect(createTransportStub.calledOnce).to.be.true;
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
      sinon.assert.calledOnce(sendMailStub);
      sinon.assert.calledWithExactly(sendMailStub, {
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
      sinon.assert.calledWithExactly(sendMailStub, {
        to: 'sometest@mail.doesnotexist',
        subject: 'Test',
        text: 'Some content',
        html: '<p>some content</p><img src="x">',
      });
    });
  });

  function getConfig() {
    return {
      config: {
        servers: {
          mailserver: {
            host: 'MAIL_HOST',
            port: '80',
            user: 'MAIL_USER',
            password: 'MAIL_PASSWORD',
            requireTLS: false,
            from: 'noreply@piatest.doesnotexist',
            name: 'PIA',
          },
        },
      },
    };
  }
});
