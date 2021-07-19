const random = require('../test.common/random');
const env = require('../test.common/env');

const configSftp = {
  configure: function ({ registry }) {
    const config = {
      sftpContainer: 'pia-sftpserver-test.int',
      sftpImage: `${registry}/pia/psa.server.sftpserver:test.int`,
      sftpPath: '../psa.server.sftpserver',
      sftpPort: 22222,
      sftpUser: 'user_' + random.createRandomString(16),
      sftpPassword: random.createRandomString(16),
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our sftp variables
    config.env.MHH_FTPSERVICE_HOST = 'localhost';
    config.env.MHH_FTPSERVICE_PORT = config.sftpPort.toString();
    config.env.MHH_FTPSERVICE_USER = config.sftpUser;
    config.env.MHH_FTPSERVICE_PW = config.sftpPassword;
    config.env.HZI_FTPSERVICE_HOST = 'localhost';
    config.env.HZI_FTPSERVICE_PORT = config.sftpPort.toString();
    config.env.HZI_FTPSERVICE_USER = config.sftpUser;
    config.env.HZI_FTPSERVICE_PW = config.sftpPassword;

    env.update(config.env);

    return config;
  },
};

module.exports = configSftp;
