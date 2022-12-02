/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as path from 'path';

import { RepoMetaData } from './models/repoMetaData';

import { Exec, ExecResult } from './exec';
import { Color } from './color';
import { SingleBar } from 'cli-progress';
import { Helper } from './helper';

interface JobSpec {
  name: string;
  args: string[];
  repoDir: string;
}

interface JobsWithResult extends JobSpec {
  result: ExecResult;
}

interface JobsSpec {
  name: string;
  jobs: JobSpec[];
}

export class Runner {
  public static async executeTests(
    jobs: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    await Runner.runJobs('install', jobs.npm, ['install'], repoDir, true);
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
    jobs: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    // parallel runs of npm install can cause problems with local libraries :-/

    await Runner.runJobs('install', jobs.npm, ['ci'], repoDir, false);

    await this.executeUpdateJobUntilSuccessfully(jobs, repoDir, [
      'update',
      '-D',
    ]);

    await this.executeUpdateJobUntilSuccessfully(jobs, repoDir, ['update']);
  }

  public static async executeNpmOutdate(
    jobs: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    await Runner.runJobs('check', jobs.npm, ['outdated'], repoDir, true);
  }

  public static async executeNpmAudit(
    jobs: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    await Runner.runJobs('audit', jobs.npm, ['audit'], repoDir, true);
  }

  private static printJobInfo(
    name: string,
    _args: string[],
    jobResult: ExecResult
  ): void {
    if (jobResult.success) {
      console.log(`${name}: ${Color.successString()}`);
    } else {
      console.error(jobResult.data);
      console.log(`${name}: ${Color.failureString()}`);
    }
  }

  private static async runJobsParallel(
    specs: JobsSpec
  ): Promise<JobsWithResult[]> {
    const bar = new SingleBar({
      format: `${Color.task(
        specs.name
      )} [{bar}] {percentage}% | {value}/{total}`,
    });

    bar.start(specs.jobs.length, 0);

    const results: { spec: JobSpec; jobResult: Promise<ExecResult> }[] = [];
    for (const job of specs.jobs) {
      results.push({
        spec: job,
        jobResult: Exec.run('npm', job.args, path.join(job.repoDir, job.name)),
      });
    }

    let open = results.map(async (result) => result.jobResult);

    while (open.length > 0) {
      await Promise.race(open);
      const stillOpen: Promise<ExecResult>[] = [];
      for (const o of open) {
        if (!(await Helper.isFinished(o))) {
          stillOpen.push(o);
        }
      }
      open = stillOpen;
      bar.update(specs.jobs.length - open.length);
    }
    bar.stop();

    const result: JobsWithResult[] = [];

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
    specs: JobsSpec
  ): Promise<JobsWithResult[]> {
    const bar = new SingleBar({
      format: `${Color.task(
        specs.name
      )} [{bar}] {percentage}% | {value}/{total}`,
    });
    bar.start(specs.jobs.length, 0);

    const results: { spec: JobSpec; jobResult: ExecResult }[] = [];
    for (let i = 0; i < specs.jobs.length; i++) {
      const job = specs.jobs[i]!;
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

    const result: JobsWithResult[] = [];
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
  ): Promise<JobsWithResult[]> {
    const specs: JobsSpec = {
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

  private static async executeUpdateJobUntilSuccessfully(
    jobs: RepoMetaData,
    repoDir: string,
    args: string[]
  ): Promise<void> {
    // I don't exactly know why, but for some repos we have to run the update multiple times.
    // So we are updating until there are no more messages about updates.
    let toInstall = [...jobs.npm];
    let iterations = 0;
    const maxIterations = 10;
    while (toInstall.length > 0) {
      const result = await Runner.runJobs(
        'update',
        toInstall,
        args,
        repoDir,
        false
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
      if (iterations > maxIterations) {
        console.log(Color.error('unable to update'));
        break;
      }
    }
  }
}
