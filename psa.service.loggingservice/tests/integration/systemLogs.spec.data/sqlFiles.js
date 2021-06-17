const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

exports.cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});

exports.setupFile = new QueryFile(path.join(__dirname, 'setup.sql'), {
  minify: true,
});
