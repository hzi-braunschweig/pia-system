import { promisify } from 'util';
import * as childProcess from 'child_process';

const exec = promisify(childProcess.exec);

export interface IResult {
  success: boolean;
  stderr: string;
}

export class Docker {
  public static async restart(containerName: string): Promise<IResult> {
    try {
      const result = await exec(`docker restart ${containerName}`);
      return {
        success: true,
        stderr: result.stderr,
      };
    } catch {
      return {
        success: false,
        stderr: '',
      };
    }
  }
}
