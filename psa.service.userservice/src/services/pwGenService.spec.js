const expect = require('chai').expect;

const sut = require('./pwGenService.js');

describe('pwGenService', function () {
  describe('genRandomPw', function () {
    this.timeout(30000);

    it('should create a password that meets the regex for 10k tries', function () {
      for (let i = 0; i < 10000; i++) {
        const pw = sut.genRandomPw();
        expect(pw).to.be.a('string');
        expect(/.*[0-9].*/.test(pw)).to.be.true;
        expect(/.*[a-z].*/.test(pw)).to.be.true;
        expect(/.*[A-Z].*/.test(pw)).to.be.true;
        expect(/.*[!#$%&()*+,\-./:;<=>?@_{|}].*/.test(pw)).to.be.true;
        expect(/.*["'^`´IloO0[\]|].*/.test(pw)).to.be.false;
        expect(pw).to.not.include('~');
        expect(pw).to.have.lengthOf(12);
      }
    });
  });
});
