import childProcess from 'child_process';
import stream from 'stream';
import util from 'util';

import { LineTransformStream } from './linetransformStream';
import config from './config';

const pipeline = util.promisify(stream.pipeline);

interface IDbInfo {
  host: string;
  port: string;
  user: string;
  password: string;
}

export interface IResult {
  success: boolean;
  stderr: string;
}

function filterScript(line: string): string | null {
  // filter out lines that modify the superuser
  if (line === `DROP ROLE ${config.services.databaseservice.user};`) {
    return '-- ' + line;
  }
  if (line === `CREATE ROLE ${config.services.databaseservice.user};`) {
    return '-- ' + line;
  }
  if (line.startsWith(`ALTER ROLE ${config.services.databaseservice.user}`)) {
    return '-- ALTER ROLE ... removed, because it would contain a password and should also not be imported!';
  }

  return line;
}

export async function exportDb(
  db: IDbInfo,
  target: stream.Writable
): Promise<IResult> {
  const p = childProcess.spawn(
    'pg_dumpall',
    ['-h', db.host, '-p', db.port, '-U', db.user, '-c'],
    {
      env: {
        PATH: process.env['PATH'],
        PGPASSWORD: db.password,
      },
      stdio: [null, 'pipe', null],
    }
  );

  let stderr = '';
  p.stderr.on('data', (data) => {
    stderr += data;
  });

  await Promise.all([
    await pipeline(
      p.stdout,
      new LineTransformStream(filterScript, 'utf-8'),
      target
    ),
    new Promise((resolve) => p.on('exit', resolve)),
  ]);

  return {
    success: p.exitCode === 0,
    stderr,
  };
}

export async function importDb(
  db: IDbInfo,
  source: stream.Readable
): Promise<IResult> {
  const args = [
    '-v',
    'ON_ERROR_STOP=ON',
    '-h',
    db.host,
    '-p',
    db.port,
    '-U',
    db.user,
    '-d',
    'postgres',
  ];
  const env = {
    PATH: process.env['PATH'],
    PGPASSWORD: db.password,
  };

  const p = childProcess.spawn('psql', args, {
    env,
    stdio: ['pipe', null, null],
  });

  // Drop all active connections
  p.stdin.write(
    `SELECT pid, PG_TERMINATE_BACKEND(pid)
         FROM pg_stat_activity
         WHERE pid <> PG_BACKEND_PID();  `
  );

  let stderr = '';
  p.stderr.on('data', (data: string) => {
    stderr += data;
    console.error('' + data);
  });

  await Promise.all([
    pipeline(source, new LineTransformStream(filterScript, 'utf-8'), p.stdin),
    new Promise((resolve) => p.on('exit', resolve)),
  ]);

  return {
    success: p.exitCode === 0,
    stderr,
  };
}
