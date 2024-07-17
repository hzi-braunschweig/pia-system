/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { format, startOfToday, subDays } from 'date-fns';
import * as schedule from 'node-schedule';
import Cronjob from './cronjob';
import * as postgresqlHelper from '../services/postgresqlHelper';
import { userserviceClient } from '../clients/userserviceClient';
import { LabResult } from '../models/labResult';
import { MailService } from '@pia/lib-service-core';

interface Study {
  name: string;
  pm_email: string;
  hub_email: string;
}

/**
 * Sends a daily report to PM about new and HUB about analyzed samples
 */
export default class SendDailySampleReportMailsCronjob implements Cronjob {
  public start(): schedule.Job {
    // Once a day at 4 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;

    return schedule.scheduleJob(rule, () => {
      void this.execute();
    });
  }

  public async execute(): Promise<void> {
    const studiesPM = await postgresqlHelper.getStudiesWithPMEmail();
    const studiesHUB = await postgresqlHelper.getStudiesWithHUBEmail();

    await Promise.all(
      studiesPM.map(async (study: Study) => {
        await this.sendSampleReportToPM(study);
      })
    );

    await Promise.all(
      studiesHUB.map(async (study: Study) => {
        await this.sendSampleReportToHUB(study);
      })
    );
  }

  public async sendSampleReportToPM(study: Study): Promise<void> {
    const probandsOfStudy = await userserviceClient.getPseudonyms({
      study: study.name,
    });
    if (probandsOfStudy.length <= 0) {
      return;
    }
    const labResults = await postgresqlHelper.getNewSampledSamplesForProbands(
      probandsOfStudy
    );
    if (labResults.length > 0) {
      console.log(
        `Found ${labResults.length} sampled labresults from yesterday in study ${study.name}, which the PM will be informed about`
      );
      const sampleReportMail = {
        subject: 'PIA – neue Proben sind auf dem Weg ins Labor!',
        text: `Gestern wurden ${labResults.length} Proben in ${study.name} erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!`,
        html: `Gestern wurden <br><h3>${labResults.length}</h3><br> Proben in ${study.name} erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!`,
      };
      await MailService.sendMail(study.pm_email, sampleReportMail);
    }
  }

  public async sendSampleReportToHUB(study: Study): Promise<void> {
    const probandsOfStudy = await userserviceClient.getPseudonyms({
      study: study.name,
    });
    const labResults = (await postgresqlHelper.getNewAnalyzedSamplesForProbands(
      probandsOfStudy
    )) as LabResult[];
    if (labResults.length > 0) {
      console.log(
        `Found ${labResults.length} analyzed labresults from yesterday in study ${study.name}, which the hub will be informed about`
      );
      const analyzedDate = format(subDays(startOfToday(), 1), 'dd.MM.yy');
      const participantCount = new Set(
        labResults.map((result) => {
          return result.user_id;
        })
      ).size;
      let mailText = `Datum der Analyse an der MHH: ${analyzedDate}\nAnzahl der Teilnehmenden: ${participantCount}\nProben:\n`;
      let mailHtml = `Datum der Analyse an der MHH: ${analyzedDate}<br>Anzahl der Teilnehmenden: ${participantCount}<br>Proben:<br>`;
      labResults.forEach((result) => {
        mailText += `${result.id}, `;
        mailHtml += `${result.id}, `;
        if (result.dummy_sample_id) {
          mailText += result.dummy_sample_id + ', ';
          mailHtml += result.dummy_sample_id + ', ';
        }
      });
      const sampleReportMail = {
        subject: 'ZIFCO',
        text: mailText,
        html: mailHtml,
      };
      await MailService.sendMail(study.hub_email, sampleReportMail);
    } else {
      console.log(
        'Found no new labresults in study: ' +
          study.name +
          ', sending no email to hub'
      );
    }
  }
}
