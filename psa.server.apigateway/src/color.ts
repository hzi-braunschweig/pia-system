import chalk from 'chalk';

export class Color {
  public static success(error: string): string {
    return chalk.green(chalk.bold(error));
  }

  public static info(error: string): string {
    return chalk.blue(chalk.bold(error));
  }

  public static warn(error: string): string {
    return chalk.yellow(chalk.bold(error));
  }

  public static error(error: string): string {
    return chalk.red(chalk.bold(error));
  }

  public static route(route: string): string {
    return chalk.blue(route);
  }

  public static serviceName(serviceName: string): string {
    return chalk.cyan(serviceName);
  }

  public static protocol(protocol: string): string {
    return chalk.yellow(protocol);
  }

  public static bool(bool: boolean): string {
    return bool ? Color.success('true') : Color.error('false');
  }
}
