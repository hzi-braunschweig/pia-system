/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { db } from '../../src/db';
import { ITask } from 'pg-promise';
import FetchMocker from 'fetch-mock';
import { CreateQuestionnaireInstanceInternalDto } from '@pia-system/lib-http-clients-internal';
import { config } from '../../src/config';
import { zonedTimeToUtc } from 'date-fns-tz';

interface LogMessageMapping {
  query: string;
  message: string;
}

interface Query {
  query: string;
  arg?: Record<string, unknown> | object;
}

export function localTimeToUtc(date: Date): Date {
  return zonedTimeToUtc(date, config.timeZone);
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

export async function dbWaitWithReturn<T>(
  query: string,
  arg?: Record<string, unknown>,
  tx: ITask<unknown> | typeof db = db
): Promise<T> {
  const messages: string[] = [];
  for (const line of query.split('\n')) {
    const mapping = getMapping(line);
    if (mapping) {
      messages.push(mapping);
    }
  }

  const promise = waitForConsoleLogMessages(messages);
  const result = (await tx.query(query, arg)) as T;

  await promise;

  return result;
}

export async function txWait(
  queries: Query[],
  t: ITask<unknown> | typeof db = db
): Promise<void> {
  const messages = [];
  for (const query of queries) {
    const mapping = getMapping(query.query);
    if (mapping) {
      messages.push(mapping);
    }
  }

  const promise = waitForConsoleLogMessages(messages);
  await t.tx(async (subTx) => {
    for (const query of queries) {
      await subTx.none(query.query, query.arg);
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

export function setupPassthroughForInternalQuestionnaireServiceRequests(
  fetchMock: FetchMocker.FetchMockSandbox
): void {
  // Fake a successful request against the questionnaire service
  fetchMock.post(
    'path:/questionnaire/questionnaireInstances',
    (url: string, opts: { method: string; body: string }, request: any) => {
      console.log('url', url);
      console.log('opts', opts);
      console.log('request', request);

      if (opts.method === 'POST') {
        // Attach IDs like the service itself would do after inserting instances into the database
        const parsed = JSON.parse(
          opts.body
        ) as unknown as CreateQuestionnaireInstanceInternalDto[];
        const instances: CreateQuestionnaireInstanceInternalDto[] = parsed.map(
          (qi: CreateQuestionnaireInstanceInternalDto, idx: number) => ({
            ...qi,
            id: idx + 1,
          })
        );
        return JSON.stringify(instances);
      }
      return opts.body;
    }
  );
}

export function getInsertQuery(
  table: string,
  object: object,
  returning = true
): string {
  const fieldNames = Object.keys(object);
  const fields = fieldNames.join(', ');
  const values = fieldNames.map((key) => `$\{${key}}`).join(', ');
  const returningClause = returning ? ' RETURNING *' : '';
  return `INSERT INTO ${table} (${fields}) VALUES (${values})${returningClause};`;
}
