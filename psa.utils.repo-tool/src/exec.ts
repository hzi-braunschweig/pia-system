import { spawn } from 'child_process';

export interface IExecResult {
  code: number | null;
  signal: string | null;
  data: string;
  success: boolean;
}

export class Exec {
  public static run(
    cmd: string,
    args: string[],
    cwd: string
  ): Promise<IExecResult> {
    const child = spawn(cmd, args, {
      cwd,
      env: process.env,
    });

    let data = '';
    child.stdout.on('data', (out) => {
      data += out;
    });

    child.stderr.on('data', (out) => {
      data += out;
    });

    return new Promise((resolve, reject) => {
      child.on('exit', (code, signal) => {
        resolve({
          code,
          signal,
          data,
          success: code === 0,
        });
      });
    });
  }
}
