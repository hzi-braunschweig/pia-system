const random = require('../test.common/random');
const env = require('../test.common/env');

const setupQpia = {
  configure: function () {
    const config = {
      postgresContainer: 'pia-postgres-test.int',
      postgresImageBase: 'registry.netzlink.com/pia/psa.database:test.int-base',
      postgresImage: 'registry.netzlink.com/pia/psa.database:test.int',
      postgresPath: '../psa.database',
      postgresSecretsPath: '../psa.utils.scripts/secrets-dockerfile',
      dbUser: 'user_' + random.createRandomString(16),
      dbPassword: random.createRandomString(16),
      dbName: random.createRandomString(16),
      dbPort: 15432,

      dbLogUser: 'log_' + random.createRandomString(16),
      dbLogPassword: random.createRandomString(16),
      dbLogName: random.createRandomString(16),
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our qpia variables
    config.env.QPIA_HOST = 'localhost';
    config.env.QPIA_PORT = config.dbPort.toString();
    config.env.QPIA_USER = config.dbUser;
    config.env.QPIA_PASSWORD = config.dbPassword;
    config.env.QPIA_DB = config.dbName;
    config.env.QPIA_ACCEPT_UNAUTHORIZED = 'true';

    config.env.DB_LOG_HOST = 'localhost';
    config.env.DB_LOG_PORT = config.dbPort.toString();
    config.env.DB_LOG_USER = config.dbLogUser;
    config.env.DB_LOG_PASSWORD = config.dbLogPassword;
    config.env.DB_LOG_DB = config.dbName;
    config.env.DB_LOG_ACCEPT_UNAUTHORIZED = 'true';

    env.update(config.env);

    return config;
  },
};

module.exports = setupQpia;
