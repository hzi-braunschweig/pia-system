/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chalk from 'chalk';
import cliProgress from 'cli-progress';
import * as util from 'util';
import { faker } from '@faker-js/faker/locale/de';

import { UserClient } from '../clients/user.client';
import { StudyClient } from '../clients/study.client';
import { RandomDataService } from '../services/random-data.service';
import { AuthToken, UserCredentials } from '../models/user.model';
import { QuestionnaireClient } from '../clients/questionnaire.client';
import { BloodSampleClient } from '../clients/bloodsample.client';
import { UserExportService } from '../services/user-export.service';

export interface GenerateTestDataCommandConfig {
  ci: boolean;
  version: string;
  adminUser: string;
  adminPassword: string;
  keycloakUser: string;
  keycloakPassword: string;
  host: string;
  baseUrl: string;
  adminBaseUrl: string;
  mailserverBaseUrl: string;
  studiesCount: number;
  questionnairesCount: number[] | number;
  probandsCount: number;
  bloodSamplesCount: number;
  studyPrefix: string;
  probandsExportFile: string;
  professionalsExportFile: string;
  submitQuestions: boolean;
}

const sleep = util.promisify(setTimeout);

const questionnaireInstancesAnsweredProbability = 70;
const parallelRequestsCount = 3;

export class GenerateTestDataCommand {
  private static userClient: UserClient;
  private static studyClient: StudyClient;
  private static questionnaireClient: QuestionnaireClient;
  private static bloodSampleClient: BloodSampleClient;
  private static config: GenerateTestDataCommandConfig;

  private static studiesCreated = new Set<string>();

  public static async execute(opts: Record<string, string>): Promise<void> {
    this.config = {
      ...(opts as unknown as GenerateTestDataCommandConfig),
      baseUrl: `https://${opts.host}/api/v1`,
      adminBaseUrl: `https://${opts.host}/admin/api/v1`,
      studiesCount: parseInt(opts.studiesCount),
      probandsCount: parseInt(opts.probandsCount),
      bloodSamplesCount: parseInt(opts.bloodSamplesCount),
      submitQuestions: !!opts.submitQuestions,
      questionnairesCount: this.parseQuestionnairesCount(opts),
    };

    this.validateQuestionnairesCount();

    console.log(chalk.underline(chalk.green('Creating Test Data')));
    console.log(chalk.bold('Host: ') + chalk.blue(this.config.host));
    console.log(chalk.bold('Studies: ') + chalk.blue(this.config.studiesCount));
    console.log(
      chalk.bold('Probands: ') + chalk.blue(this.config.probandsCount)
    );
    console.log(
      chalk.bold('Probands Export File: ') +
        chalk.blue(this.config.probandsExportFile)
    );

    const probandsExport = new UserExportService({
      probands: this.config.probandsExportFile,
      professionals: this.config.professionalsExportFile,
    });

    this.userClient = new UserClient(
      this.config.ci,
      this.config.baseUrl,
      this.config.adminBaseUrl,
      {
        username: this.config.keycloakUser,
        password: this.config.keycloakPassword,
        realm: 'master',
      },
      {
        username: this.config.adminUser,
        password: this.config.adminPassword,
        realm: 'admin',
      },
      probandsExport
    );

    this.studyClient = new StudyClient(
      this.config.baseUrl,
      this.config.adminBaseUrl,
      this.userClient
    );
    this.questionnaireClient = new QuestionnaireClient(
      this.config.baseUrl,
      this.config.adminBaseUrl
    );
    this.bloodSampleClient = new BloodSampleClient(this.config.adminBaseUrl);

    RandomDataService.studyPrefix = this.config.studyPrefix;

    for (let i = 0; i < this.config.studiesCount; i++) {
      console.log('');
      console.log(chalk.grey('============================'));
      console.log(chalk.bold(`Study #${i + 1}`));
      console.log(chalk.grey('============================'));
      await this.createFullStudy(this.config);
    }

    console.log(chalk.bold(`Done`));
    probandsExport.writeExport();
  }

  public static async createFullStudy(
    config: GenerateTestDataCommandConfig
  ): Promise<void> {
    const studyId = await this.studyClient.createStudy(
      RandomDataService.getRandomStudy()
    );

    this.studiesCreated.add(studyId);

    const forscherCredentials = await this.userClient.createProfessionalUser(
      RandomDataService.getRandomProfessionalUser('Forscher', studyId)
    );

    const forscherToken =
      this.userClient.getRefreshableToken(forscherCredentials);
    await this.createQuestionnaires(studyId, forscherToken);

    const utCredentials = await this.userClient.createProfessionalUser(
      RandomDataService.getRandomProfessionalUser('Untersuchungsteam', studyId)
    );
    const getUtToken = this.userClient.getRefreshableToken(utCredentials);

    // we want the user to be logged in before doing parallel requests
    await getUtToken();

    let progress: cliProgress.SingleBar | null = null;

    if (!this.config.ci) {
      progress = new cliProgress.SingleBar(
        {
          format:
            'Probands | {bar} | {percentage}% | {value}/{total} | ETA: {eta_formatted} | Duration: {duration_formatted} | Username: {username}',
        },
        cliProgress.Presets.shades_grey
      );

      progress.start(config.probandsCount, 0);
    }

    const createProbandsPromises: Promise<void>[] = [];
    for (let i = 0; i < config.probandsCount; i++) {
      if (i - parallelRequestsCount >= 0) {
        await createProbandsPromises[i - parallelRequestsCount];
      }
      createProbandsPromises.push(
        this.createProbandWithData(
          studyId,
          config.bloodSamplesCount,
          getUtToken,
          (username) => progress?.increment({ username })
        )
      );
    }
    await Promise.all(createProbandsPromises);
    progress?.stop();
  }

  private static async createQuestionnaires(
    studyId: string,
    forscherToken: () => Promise<AuthToken>
  ) {
    let questionnairesCount = 1;

    if (Array.isArray(this.config.questionnairesCount)) {
      questionnairesCount =
        this.config.questionnairesCount[this.studiesCreated.size - 1];
    } else if (typeof this.config.questionnairesCount === 'number') {
      questionnairesCount = this.config.questionnairesCount;
    }

    for (let i = 0; i < questionnairesCount; i++) {
      await this.questionnaireClient.createQuestionnaire(
        RandomDataService.getRandomQuestionnaire(studyId),
        await forscherToken()
      );
    }
  }

  static async createProbandWithData(
    studyId: string,
    bloodSamplesCount: number,
    utToken: () => Promise<AuthToken>,
    doneCallback: (username: string) => void
  ): Promise<void> {
    const credentials = await this.userClient.createProband(
      RandomDataService.getRandomProband(),
      studyId,
      utToken
    );

    if (this.config.submitQuestions) {
      // wait for analyzerservice to create questionnaire instances
      await sleep(500);
      await this.randomlyAnswerQuestionnaires(credentials);
    }

    for (let i = 0; i < bloodSamplesCount; i++) {
      await this.createRandomBloodSample(credentials.username, utToken);
    }

    doneCallback(credentials.username);
  }

  static async randomlyAnswerQuestionnaires(
    probandCredentials: UserCredentials
  ) {
    const token = await this.userClient.getRefreshableToken(probandCredentials);
    const instances =
      await this.questionnaireClient.getQuestionnaireInstancesForProband(
        await token()
      );

    const getProbandToken = await token();

    const instancesToAnswer = instances.filter(
      () =>
        faker.datatype.number(100) <= questionnaireInstancesAnsweredProbability
    );

    const answerPromises = instancesToAnswer
      .map((instance) => ({
        questionnaireInstanceId: instance.id,
        answers: RandomDataService.getRandomAnswers(instance),
      }))
      .map(({ questionnaireInstanceId, answers }) =>
        this.questionnaireClient.createAnswers(
          questionnaireInstanceId,
          answers,
          getProbandToken
        )
      );

    const answerQuestionsPromises: Promise<void>[] = [];

    for (let i = 0; i < answerPromises.length; i++) {
      if (i - parallelRequestsCount >= 0) {
        await answerPromises[i - parallelRequestsCount];
      }
      answerQuestionsPromises.push(answerPromises[i]);
    }

    await Promise.all(answerQuestionsPromises);

    await Promise.all(
      instancesToAnswer.map(async (instance) =>
        this.questionnaireClient.releaseQuestionnaireInstance(
          instance.id,
          await token()
        )
      )
    );
  }

  static async createRandomBloodSample(
    probandId: string,
    utToken: () => Promise<AuthToken>
  ) {
    const sampleId = faker.datatype.uuid();
    await this.bloodSampleClient.createBloodSample(
      probandId,
      sampleId,
      utToken
    );
    await this.bloodSampleClient.changeBloodSample(
      probandId,
      sampleId,
      RandomDataService.getRandomBloodSample(),
      utToken
    );
  }

  private static validateQuestionnairesCount(): void {
    if (
      Array.isArray(this.config.questionnairesCount) &&
      this.config.questionnairesCount.length !== this.config.studiesCount
    ) {
      throw new Error(
        'You defined an array for --questionnaires-count. Please ensure its length matches the number of studies to create.'
      );
    }
  }

  private static parseQuestionnairesCount(
    opts: Record<string, string>
  ): number[] | number {
    if (opts.questionnairesCount.includes(',')) {
      return opts.questionnairesCount
        .split(',')
        .map((v) => parseInt(v.trim(), 10));
    }
    return parseInt(opts.questionnairesCount);
  }
}
