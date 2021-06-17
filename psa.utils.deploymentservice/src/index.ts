import http from 'http';
import config from './config';
import * as postgres from './postgres';
import { Docker } from './docker';
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

async function requestListener(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    const uri = url.parse(req.url ?? '');
    const path = uri.pathname;

    if (!req.headers.authorization || !checkAuth(req.headers.authorization)) {
      console.log(`${String(req.method)} ${String(path)}: unauthorized`);
      res.statusCode = 401;
      res.end();
      return;
    }

    if (
      config.features.export &&
      req.method === 'GET' &&
      path === '/deployment/db/qpia'
    ) {
      res.setHeader('content-disposition', 'attachment; filename="export.sql"');
      res.setHeader('content-type', 'application/sql');

      const result = await postgres.exportDb(
        config.services.databaseservice,
        res
      );
      handleResult(req.method, path, res, result);
      return;
    }
    if (
      config.features.import &&
      req.method === 'POST' &&
      path === '/deployment/db/qpia'
    ) {
      const importResult = await postgres.importDb(
        config.services.databaseservice,
        req
      );

      const query = uri.query ? querystring.parse(uri.query) : {};

      if (!importResult.success || query['restartDb'] === 'false') {
        handleResult(req.method, path, res, importResult);
        return;
      }

      const restartResult = await Docker.restart('databaseservice');
      handleResult(req.method, path, res, restartResult);
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
