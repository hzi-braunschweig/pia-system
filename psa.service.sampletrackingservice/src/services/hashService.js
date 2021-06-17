const crypto = require('crypto');

const hashService = (function () {
  /**
   * Creates a MD5 hash from a string
   * @param string
   * @returns {string} hex value of the hash
   */
  function createMd5Hash(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  return {
    /**
     * @function
     * @description Creates a MD5 hash from a string
     * @memberof module:hashService
     */
    createMd5Hash: createMd5Hash,
  };
})();

module.exports = hashService;
