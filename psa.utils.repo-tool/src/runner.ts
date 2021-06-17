import * as path from 'path';

import { IJobs } from './definitions';

import { Exec, IExecResult } from './exec';
import { Color } from './color';
import { SingleBar } from 'cli-progress';
import { Helper } from './helper';

interface IJobSpec {
  name: string;
  args: string[];
  repoDir: string;
}

interface IJobsWithResult extends IJobSpec {
  result: IExecResult;
}

interface IJobsSpec {
  name: string;
  jobs: IJobSpec[];
}

export class Runner {
  private static printJobInfo(
    name: string,
    args: string[],
    jobResult: IExecResult
  ) {
    if (jobResult.success) {
      console.log(`${name}: ${Color.successString()}`);
    } else {
      console.error(jobResult.data);
      console.log(`${name}: ${Color.failureString()}`);
    }
  }

  private static async runJobsParallel(
    specs: IJobsSpec
  ): Promise<IJobsWithResult[]> {
    const bar = new SingleBar({
      format: `${Color.task(
        specs.name
      )} [{bar}] {percentage}% | {value}/{total}`,
    });

    bar.start(specs.jobs.length, 0);

    const results: { spec: IJobSpec; jobResult: Promise<IExecResult> }[] = [];
    for (const job of specs.jobs) {
      results.push({
        spec: job,
        jobResult: Exec.run('npm', job.args, path.join(job.repoDir, job.name)),
      });
    }

    let open = results.map((result) => result.jobResult);

    while (open.length > 0) {
      await Promise.race(open);
      const stillOpen: Promise<IExecResult>[] = [];
      for (const o of open) {
        if (!(await Helper.isFinished(o))) {
          stillOpen.push(o);
        }
      }
      open = stillOpen;
      bar.update(specs.jobs.length - open.length);
    }
    bar.stop();

    const result: IJobsWithResult[] = [];

    for (const job of results) {
      const jobResult = await job.jobResult;
      Runner.printJobInfo(job.spec.name, job.spec.args, jobResult);
      result.push(
        Object.assign(job.spec, {
          result: jobResult,
        })
      );
    }
    return result;
  }

  private static async runJobsSerial(
    specs: IJobsSpec
  ): Promise<IJobsWithResult[]> {
    const bar = new SingleBar({
      format: `${Color.task(
        specs.name
      )} [{bar}] {percentage}% | {value}/{total}`,
    });
    bar.start(specs.jobs.length, 0);

    const results: { spec: IJobSpec; jobResult: IExecResult }[] = [];
    for (let i = 0; i < specs.jobs.length; i++) {
      const job = specs.jobs[i];
      results.push({
        spec: job,
        jobResult: await Exec.run(
          'npm',
          job.args,
          path.join(job.repoDir, job.name)
        ),
      });
      bar.update(i + 1, { name: job.name });
    }
    bar.stop();

    const result: IJobsWithResult[] = [];
    for (const job of results) {
      Runner.printJobInfo(job.spec.name, job.spec.args, job.jobResult);
      result.push(
        Object.assign(job.spec, {
          result: job.jobResult,
        })
      );
    }
    return result;
  }

  private static async runJobs(
    name: string,
    jobs: string[],
    args: string[],
    repoDir: string,
    parallel: boolean
  ): Promise<IJobsWithResult[]> {
    const specs: IJobsSpec = {
      name,
      jobs: jobs.map((job) => {
        return {
          name: job,
          args,
          repoDir,
        };
      }),
    };
    if (parallel) {
      return await Runner.runJobsParallel(specs);
    } else {
      return await Runner.runJobsSerial(specs);
    }
  }

  public static async executeTests(
    jobs: IJobs,
    repoDir: string
  ): Promise<void> {
    await Runner.runJobs(
      'install',
      jobs.npmInstall,
      ['install'],
      repoDir,
      true
    );
    await Runner.runJobs('lint', jobs.lint, ['run', 'lint'], repoDir, true);
    await Runner.runJobs(
      'test.unit',
      jobs.testUnit,
      ['run', 'test.unit'],
      repoDir,
      true
    );
    await Runner.runJobs(
      'test.int',
      jobs.testInt,
      ['run', 'test.int'],
      repoDir,
      false
    );
  }

  public static async executeNpmUpdate(
    jobs: IJobs,
    repoDir: string
  ): Promise<void> {
    // parallel runs of npm install can cause problems with local libraries :-/
    await Runner.runJobs(
      'install',
      jobs.npmInstall,
      ['install'],
      repoDir,
      false
    );

    await this.executeUpdateJobUntilSuccessfully(jobs, repoDir, [
      'update',
      '-D',
    ]);

    await this.executeUpdateJobUntilSuccessfully(jobs, repoDir, ['update']);
  }

  private static async executeUpdateJobUntilSuccessfully(
    jobs: IJobs,
    repoDir: string,
    args: string[]
  ): Promise<void> {
    // I don't exactly know why, but for some repos we have to run the update multiple times.
    // So we are updating until there are no more messages about updates.
    let toInstall = [...jobs.npmInstall];
    let iterations = 0;
    while (toInstall.length > 0) {
      const result = await Runner.runJobs(
        'update',
        toInstall,
        args,
        repoDir,
        true
      );
      toInstall = toInstall.filter((value) => {
        const job = result.find((r) => {
          return r.name === value;
        });
        if (!job) {
          return false;
        }
        // don't retry failed jobs
        if (!job.result.success) {
          return false;
        }
        // don't retry job if there is no output
        // in this case everything should be fine
        return job.result.data !== '';
      });
      iterations++;
      if (iterations > 10) {
        console.log(Color.error('unable to update'));
        break;
      }
    }
  }

  public static async executeNpmOutdate(
    jobs: IJobs,
    repoDir: string
  ): Promise<void> {
    await Runner.runJobs('check', jobs.npmInstall, ['outdated'], repoDir, true);
  }
}
