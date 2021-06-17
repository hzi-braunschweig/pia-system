const expect = require('chai').expect;

const CsvSanatizer = require('./csvSanatizer');

describe('CsvSanatizer', () => {
  describe('removeMaliciousChars()', () => {
    it('should prevent malicious usage of the "=" character', () => {
      // Arrange
      const string = '=Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(string);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should prevent malicious usage of the "+" character', () => {
      // Arrange
      const items = '+Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(items);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should prevent malicious usage of the "-" character', () => {
      // Arrange
      const items = '-Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(items);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should prevent malicious usage of the "@" character', () => {
      // Arrange
      const items = '@Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(items);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should prevent malicious usage of multiple same characters', () => {
      // Arrange
      const string = '@@@Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(string);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should prevent malicious usage of multiple different characters', () => {
      // Arrange
      const string = '@=+Risky string for CSV';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(string);

      // Assert
      expect(result).to.equal('Risky string for CSV');
    });

    it('should leave characters if not malicous', () => {
      // Arrange
      const string = 'this_is_a_mail@adress.com';

      // Act
      const result = CsvSanatizer.removeMaliciousChars(string);

      // Assert
      expect(result).to.equal(string);
    });
  });
});
