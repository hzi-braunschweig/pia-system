const pgp = require('pg-promise')();

exports.mochaHooks = {
  afterAll(done) {
    console.log('closing db pool...');
    pgp.end();
    done();
  },
};
