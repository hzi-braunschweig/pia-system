const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

const { db } = require('../../../src/db');

const setupFile = new QueryFile(path.join(__dirname, 'setup.sql'), {
  minify: true,
});
const cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});
exports.setup = async function () {
  await db.none(cleanupFile);
  await db.none(setupFile);
};

exports.cleanup = async function () {
  await db.none(cleanupFile);
};
