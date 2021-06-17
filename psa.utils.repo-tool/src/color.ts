import chalk from 'chalk';

export class Color {
  public static successString() {
    return chalk.green('✅');
  }

  public static failureString() {
    return chalk.red('❎');
  }

  public static task(task: string) {
    return chalk.blue(task);
  }

  public static error(error: string) {
    return chalk.red(chalk.bold(error));
  }
}
