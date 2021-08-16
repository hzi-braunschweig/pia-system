/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;

const sut = require('./pwHashesHelper.js');

describe('pwHashesHelper', function () {
  describe('saltHashPassword', function () {
    it('should generate a hash value for specific password and salt', function (done) {
      const res = sut.hashThePasswordWithSaltAndPepper(
        'Testpasswort',
        '5e7575c6d0cc76f4'
      );
      expect(res.passwordHash).to.equal(
        '1a890dc3814a1bcb79fcacb2a1ff61f00bc245bba6812a67a0450fd2d682d5fa82d082cd8cf00e6e2dee33c97949ed59046e0a54481ee646e29c4de1d9d92feee19d60f86b9a1946c162e97410195d1c7e419ae0773ad80020b9a0211932fa0883749167fd230189f02efc61704c734f3d47a99df45e5ceef8b78a2a57baea23'
      );
      done();
    });
    it('should fail for a correct password and  wrong salt', function (done) {
      const res = sut.hashThePasswordWithSaltAndPepper(
        'Testpasswort',
        'wrongSalt1234567'
      );
      expect(res.passwordHash).to.not.equal(
        '1a890dc3814a1bcb79fcacb2a1ff61f00bc245bba6812a67a0450fd2d682d5fa82d082cd8cf00e6e2dee33c97949ed59046e0a54481ee646e29c4de1d9d92feee19d60f86b9a1946c162e97410195d1c7e419ae0773ad80020b9a0211932fa0883749167fd230189f02efc61704c734f3d47a99df45e5ceef8b78a2a57baea23'
      );
      done();
    });
    it('should fail for wrong password and correct salt', function (done) {
      const res = sut.hashThePasswordWithSaltAndPepper(
        'WrongPasswort',
        '5e7575c6d0cc76f4'
      );
      expect(res.passwordHash).to.not.equal(
        '1a890dc3814a1bcb79fcacb2a1ff61f00bc245bba6812a67a0450fd2d682d5fa82d082cd8cf00e6e2dee33c97949ed59046e0a54481ee646e29c4de1d9d92feee19d60f86b9a1946c162e97410195d1c7e419ae0773ad80020b9a0211932fa0883749167fd230189f02efc61704c734f3d47a99df45e5ceef8b78a2a57baea23'
      );
      done();
    });
  });

  describe('password with pepper', function () {
    it('should return a hash value for a constant pepper', function () {
      const res = sut.hashThePasswordWithPepper('Testpasswort');
      expect(res.passwordHash).to.equal(
        'b20da43e6651288417c9ffb2f90959ea206df0445272a83fb0e6d64eed3c2ad71a646245a58236d183e1aab494a817904b5c3a36f7a796a0c8142198dbcb8b60'
      );
    });
  });
});
