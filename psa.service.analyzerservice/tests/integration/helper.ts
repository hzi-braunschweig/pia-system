/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { db } from '../../src/db';

interface LogMessageMapping {
  query: string;
  message: string;
}

interface Query {
  query: string;
  arg?: Record<string, unknown>;
}

async function waitForConsoleLogMessages(messages: string[]): Promise<void> {
  if (messages.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const oldConsoleLog = console.log;
    console.log = (...args: unknown[]): void => {
      // eslint-disable-next-line prefer-spread
      oldConsoleLog.apply(null, args);
      const index = messages.indexOf(args[0] as string);
      if (index !== -1) {
        messages.splice(index, 1);
      }
      if (messages.length === 0) {
        console.log = oldConsoleLog;
        resolve();
      }
    };
  });
}

const mappings: LogMessageMapping[] = [
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
    query: 'UPDATE questionnaires',
    message: "Processed 'table_update' notification for table 'questionnaires'",
  },
];

function getMapping(query: string): string | undefined {
  for (const mapping of mappings) {
    if (query.startsWith(mapping.query)) {
      return mapping.message;
    }
  }
  return undefined;
}

export async function dbWait(
  query: string,
  arg?: Record<string, unknown>
): Promise<void> {
  const messages: string[] = [];
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

export async function txWait(queries: Query[]): Promise<void> {
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

export async function waitForConditionToBeTrue(
  conditionFn: () => boolean,
  tries = 3,
  timeout = 50
): Promise<void> {
  return new Promise<void>((resolve) => {
    let count = 0;
    const handler = (): unknown =>
      conditionFn() || count > tries ? resolve() : count++;

    setInterval(handler, timeout);
  });
}
