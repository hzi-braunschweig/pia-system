import fs from 'fs';

export class ConfigUtils {
  /**
   * Reads an environment variable by its name. Throws errors for undefined variables by default.
   * You may either pass a fallback value or ignore undefined variables by setting the env
   * variable IGNORE_MISSING_CONFIG to the value '1'
   * @param key name of environment variable
   * @param fallback value to use if variable is undefined
   */
  public static getEnvVariable(key: string, fallback?: string): string {
    // key is always a string which is literally defined wihtin this class
    // eslint-disable-next-line security/detect-object-injection
    const result = process.env[key];
    if (result === undefined) {
      if (fallback !== undefined) {
        return fallback;
      }
    }
    if (result === undefined) {
      if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
        return '';
      }
      throw new Error(`missing config variable '${key}'`);
    }
    return result;
  }

  public static getFileContent(path: string): Buffer {
    try {
      // path is always a string which is literally defined wihtin this class
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return fs.readFileSync(path);
    } catch (e) {
      if (process.env['IGNORE_MISSING_CONFIG'] === '1') {
        return Buffer.from('');
      }
      throw e;
    }
  }
}
