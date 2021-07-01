import * as schedule from 'node-schedule';
import { ModysImportService } from './modysImportService';
import { Job } from 'node-schedule';

export class TaskScheduler {
  private static job: Job;

  public static init(): void {
    TaskScheduler.scheduleUpdatesFromModys();
  }

  public static stop(): void {
    this.job.cancel();
  }

  private static scheduleUpdatesFromModys(): void {
    void ModysImportService.startImport();

    // Once a day at 10 pm
    this.job = schedule.scheduleJob(
      { hour: 22, minute: 0 },
      () => void ModysImportService.startImport()
    );
  }
}
