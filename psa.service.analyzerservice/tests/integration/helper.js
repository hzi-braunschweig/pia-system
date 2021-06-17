const { db } = require('../../src/db');

function waitForConsoleLogMessages(messages) {
  if (messages.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const oldConsoleLog = console.log;
    console.log = (...args) => {
      oldConsoleLog.apply(null, args);
      const index = messages.indexOf(args[0]);
      if (index !== -1) {
        messages.splice(index, 1);
      }
      if (messages.length === 0) {
        console.log = oldConsoleLog;
        resolve(args);
      }
    };
  });
}

const mappings = [
  {
    query: 'INSERT INTO "questionnaires"',
    message: "Processed 'table_insert' notification for table 'questionnaires'",
  },
  {
    query: 'INSERT INTO questionnaires',
    message: "Processed 'table_insert' notification for table 'questionnaires'",
  },
  {
    query: 'UPDATE questionnaire_instances',
    message:
      "Processed 'table_update' notification for table 'questionnaire_instances'",
  },
  {
    query: 'UPDATE users',
    message: "Processed 'table_update' notification for table 'users'",
  },
  {
    query: 'UPDATE questionnaires',
    message: "Processed 'table_update' notification for table 'questionnaires'",
  },
  {
    query: 'INSERT INTO study_users',
    message: "Processed 'table_insert' notification for table 'study_users'",
  },
  {
    query: 'DELETE FROM study_users',
    message: "Processed 'table_update' notification for table 'study_users'",
  },
];

function getMapping(query) {
  for (const mapping of mappings) {
    if (query.startsWith(mapping.query)) {
      return mapping.message;
    }
  }
}

async function dbWait(query, arg) {
  const messages = [];
  for (const line of query.split('\n')) {
    const mapping = getMapping(line);
    if (mapping) {
      messages.push(mapping);
    }
  }

  const promise = waitForConsoleLogMessages(messages);
  await db.none(query, arg);
  await promise;
}

async function txWait(queries) {
  const messages = [];
  for (const query of queries) {
    const mapping = getMapping(query.query);
    if (mapping) {
      messages.push(mapping);
    }
  }

  const promise = waitForConsoleLogMessages(messages);
  await db.tx(async (t) => {
    for (const query of queries) {
      await t.none(query.query, query.arg);
    }
  });
  await promise;
}

exports.dbWait = dbWait;
exports.txWait = txWait;
