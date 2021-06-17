const expect = require('chai').expect;
const sm = require('./mapperService.js');

describe('mapperService', function () {
  describe('mapPiaToSormas', function () {
    it('should map data correctly', function () {
      const indata = {
        birthdate: '2010-06-07',
        onsetDate: '1970-01-01 00:00Z',
        temperature: '36,5',
        temperatureSource: 2,
        heartRate: '100',
        chillsSweats: 0,
        cough: 1,
        runnyNose: 2,
      };
      const outdata = {
        birthdateDD: 7,
        birthdateMM: 6,
        birthdateYY: 2010,
        onsetDate: 0,
        temperature: '36.5',
        temperatureSource: 'ORAL',
        heartRate: '100',
        chillsSweats: 'NO',
        cough: 'YES',
        runnyNose: 'UNKNOWN',
      };

      expect(sm.mapPiaToSormas(indata)).to.eql(outdata);
    });

    it('should ignore unknown data', function () {
      const indata = {
        xyz: 123,
      };

      expect(sm.mapPiaToSormas(indata)).to.be.empty;
    });

    it('should ignore dates without value', () => {
      const indata2 = {
        DG_1: '',
      };

      expect(sm.mapPiaToSormas(indata2)).to.be.empty;
    });
  });
});
