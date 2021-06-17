const { config } = require('./config');

const mysql = require('promise-mysql');

/**
 * @description helper methods to access modys db
 */
const dbModys = (function () {
  let db = null;

  async function connectToModys() {
    if (db === null || db === undefined) {
      db = await mysql.createConnection(config.modys);
      console.log('connected to modys');
    } else {
      console.log('was already connected to modys');
    }
    return db;
  }

  function disconnectFromModys() {
    if (db !== null && db !== undefined) {
      db.end();
      db = null;
      console.log('disconnected from modys');
    } else {
      console.log('was already disconnected from modys');
    }
  }

  async function checkConnection() {
    let tmpDb;
    try {
      tmpDb = await mysql.createConnection(config.modys);
      await tmpDb.query('SELECT 1;');
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      if (tmpDb) {
        tmpDb.end();
      }
    }
  }

  return {
    /**
     * @function
     * @description connects to MODYS
     * @memberof module:dbModys
     */
    connectToModys: connectToModys,

    /**
     * @function
     * @description disconnects from MODYS
     * @memberof module:dbModys
     */
    disconnectFromModys: disconnectFromModys,

    /**
     * @function
     * @description checks the connection to modys
     * @memberof module:dbModys
     */
    checkConnection: checkConnection,
  };
})();

module.exports = dbModys;
