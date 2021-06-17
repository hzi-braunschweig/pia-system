const publisher = require('@pact-foundation/pact-node');
const path = require('path');

const opts = {
  pactFilesOrDirs: [path.resolve(process.cwd(), 'pacts')],
  pactBroker: process.env.PACT_BROKER || 'http://localhost:9292',
  pactBrokerUsername: process.env.PACT_USERNAME,
  pactBrokerPassword: process.env.PACT_PASSWORD,
  consumerVersion: '2.0.0',
};

publisher.publishPacts(opts);
