/**
 * @description in-memory storage of blocked IPs; or, to be more precise, contains all IPs as all have the potential of being blocked soon
 */

const blockedIPService = (function () {
  const LRU_MAX = 1000;
  let LRU; // List of last blocked IPs
  let blockedIPs; // Blocked IPs data, indexed by IP

  function initService() {
    LRU = [];
    blockedIPs = {};
  }

  function put(ip, data) {
    const lruPos = LRU.indexOf(ip);
    if (lruPos >= 0) {
      LRU.splice(lruPos, 1);
    } else if (LRU.length >= LRU_MAX) {
      delete blockedIPs[LRU.shift()];
    }
    LRU.push(ip);
    blockedIPs[ip] = data;
    console.log(blockedIPs);
  }

  function get(ip) {
    const blockedIP = blockedIPs[ip];
    if (blockedIP) {
      return blockedIP;
    }
    return {
      number_of_wrong_attempts: null,
      third_wrong_password_at: 0,
    };
  }

  return {
    /**
     * @function
     * @description initializes the list of blocked IPs
     * @memberof module:blockedIPService
     */
    initService: initService,

    /**
     * @function
     * @description gets data object for blocked IP from storage
     * @param {string} ip
     * @memberof module:blockedIPService
     */
    get: get,

    /**
     * @function
     * @description puts data object for blocked IP into storage
     * @param {string} ip
     * @param {object} data
     * @memberof module:blockedIPService
     */
    put: put,
  };
})();

module.exports = blockedIPService;
