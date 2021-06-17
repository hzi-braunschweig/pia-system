const crypto = require('crypto');

const random = {
  createRandomString: function (length) {
    return crypto
      .randomBytes(length / 2 + 1)
      .toString('hex')
      .substring(0, length);
  },
};

module.exports = random;
