/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import chalk from 'chalk';
import * as https from 'https';

// For running fetch against local instances, we need to allow insecure connections
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export default async function fetch(
  url: RequestInfo,
  init: RequestInit,
  verbose = false
): Promise<Response | undefined> {
  const response = await nodeFetch(url, { ...init, agent: httpsAgent });
  const logPrefix = `${chalk.bold(init.method?.toUpperCase())} ${String(url)}`;

  if (verbose) {
    console.log(
      logPrefix,
      getColoredStatusText(response.status, response.statusText)
    );
  }

  if (response.status > 300) {
    throw new Error(
      `${logPrefix} ${response.status} 
      ${response.statusText}: ${await response.text()}`
    );
  }

  return response;
}

function getColoredStatusText(status: number, statusText: string): string {
  if (status <= 300) {
    return chalk.green(statusText);
  } else {
    return chalk.red(statusText);
  }
}
