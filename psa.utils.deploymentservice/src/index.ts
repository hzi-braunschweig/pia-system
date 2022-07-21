/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import http from 'http';
import config from './config';
import * as postgres from './postgres';
import { Docker, IResult } from './docker';
import url from 'url';
import querystring from 'querystring';

// to test an import:
// curl --fail -u deployer:deployer -X POST --data-binary @export.sql localhost/deployment/db/qpia

if (!config.system.isDevelopment) {
  throw new Error(
    'This service should only run on a development system! Otherwise it will leak and damage sensitive data!'
  );
}

function checkAuth(authorization: string): boolean {
  const parts = authorization.split(' ');
  if (!(parts.length > 1)) {
    return false;
  }
  const auth = Buffer.from(
    `${config.authorization.user}:${config.authorization.password}`
  ).toString('base64');
  // parts always has index 0 and 1 because its length is greater than 1
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return parts[0]!.toLowerCase() === 'basic' && parts[1]! === auth;
}

function handleResult(
  method: string,
  path: string,
  res: http.ServerResponse,
  result: postgres.IResult
): void {
  if (result.success) {
    console.log(`${method} ${path}: success`);
    res.end();
  } else {
    console.log(`${method} ${path}: `, result.stderr);
    res.statusCode = 400;
    res.end(result.stderr);
  }
}

function getConfigByPath(path: string): postgres.IDbInfo {
  switch (path) {
    case '/deployment/db/qpia':
      return config.services.databaseservice;
    case '/deployment/db/ipia':
      return config.services.ipiaservice;
    default: {
      throw new Error(`unknown path "${path}"`);
    }
  }
}

async function requestListener(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const uri = url.parse(req.url ?? '');
    const path = uri.pathname ?? '';

    if (!req.headers.authorization || !checkAuth(req.headers.authorization)) {
      console.log(`${String(req.method)} ${String(path)}: unauthorized`);
      res.statusCode = 401;
      res.end();
      return;
    }

    const pathConfig = getConfigByPath(path);

    if (
      config.features.export &&
      req.method === 'GET' &&
      path.startsWith('/deployment/db/')
    ) {
      res.setHeader('content-disposition', 'attachment; filename="export.sql"');
      res.setHeader('content-type', 'application/sql');

      const result = await postgres.exportDb(pathConfig, res);
      handleResult(req.method, path, res, result);
      return;
    }

    if (
      config.features.import &&
      req.method === 'POST' &&
      path.startsWith('/deployment/db/')
    ) {
      const importResult = await postgres.importDb(pathConfig, req);

      const query = uri.query ? querystring.parse(uri.query) : {};

      if (!importResult.success || query['restartDb'] === 'false') {
        handleResult(req.method, path, res, importResult);
        return;
      }

      const restarts = new Map<string, Promise<IResult>>();

      for (const serviceName of pathConfig.restartServices) {
        restarts.set(serviceName, Docker.restart(serviceName));
      }

      const results = await Promise.all(Array.from(restarts.values()));

      for (const result of results) {
        handleResult(req.method, path, res, result);
      }

      return;
    }

    console.log(
      `${String(req.method)} ${String(path)}: not found or not enabled`
    );
    res.statusCode = 404;
    res.end();
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end();
  }
}

const server = http.createServer((req, res) => void requestListener(req, res));
server.listen(config.web.port);

const stop = (): void => {
  console.log('SIGINT/SIGTERM received -> cleaning up...');
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);

  server.close();
};

process.addListener('SIGINT', stop);
process.addListener('SIGTERM', stop);
