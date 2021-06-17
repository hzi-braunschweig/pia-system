/**
 * The analyzerservice reacts on PG-Notifications, that get thrown
 * by the trigger for INSERT, UPDATE or DELETE statements.
 * This trigger.helper.js can be used to disable and enable the triggers
 * during setup or cleanup so their db actions do not create any unwanted
 * reaction from the analyzerservice, even though the listeningDbClient is
 * still listening for notifications.
 */

const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

const { db } = require('../../../src/db');

const enableFile = new QueryFile(path.join(__dirname, 'enable.sql'), {
  minify: true,
});
const disableFile = new QueryFile(path.join(__dirname, 'disable.sql'), {
  minify: true,
});

exports.enable = async function () {
  await db.none(enableFile);
};

exports.disable = async function () {
  await db.none(disableFile);
};
