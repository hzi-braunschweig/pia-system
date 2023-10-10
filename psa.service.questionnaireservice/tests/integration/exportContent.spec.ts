/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable security/detect-object-injection,security/detect-non-literal-fs-filename,@typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import JSZip, { JSZipObject, loadAsync } from 'jszip';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as csv from 'csv-parse/sync';
import { StatusCodes } from 'http-status-codes';
import { createSandbox } from 'sinon';
import { Response } from 'superagent';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { cleanup, setup } from './exportContent.spec.data/setup.helper';
import {
  CsvAnswerRow,
  CsvCodebookRow,
  CsvLegacyAnswerRow,
  CsvQuestionnaireRow,
  CsvUserSettingsRow,
} from '../../src/models/csvExportRows';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { userserviceClient } from '../../src/clients/userserviceClient';
import { ExportOptions } from '../../src/interactors/exportInteractor';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-exportforscher',
  studies: ['Teststudie - Export', 'Answers Export'],
});

describe('/export content should match the expected csv', function () {
  const sandbox = createSandbox();

  let responseZips: JSZip;

  before(async () => {
    await Server.init();
    await setup();

    sandbox
      .stub(userserviceClient, 'getPseudonyms')
      .resolves([
        'answ-01',
        'qtest-0000000002',
        'qtest-0000000003',
        'qtest-0000000004',
        'qtest-0000000005',
        'qtest-0000000006',
        'qtest-0000000007',
      ]);

    const questionnaires = [
      { id: 295, version: 1 },
      { id: 297, version: 1 },
      { id: 298, version: 1 },
      { id: 299, version: 1 },
      { id: 299, version: 2 },
      { id: 300, version: 1 },
    ];

    const search: ExportOptions = {
      start_date: new Date('2000-01-01'),
      end_date: new Date('2999-01-01'),
      study_name: 'Teststudie - Export',
      questionnaires,
      probands: [
        'qtest-0000000002',
        'qtest-0000000003',
        'qtest-0000000004',
        'qtest-0000000005',
        'qtest-0000000006',
      ],
      exports: [
        'legacy_answers',
        'labresults',
        'samples',
        'settings',
        'codebook',
        'questionnaires',
      ],
    };

    const authRequest = AuthServerMock.adminRealm().returnValid();

    const response: Response = await chai
      .request(apiAddress)
      .post('/admin/export')
      .set(forscherHeader1)
      .send(search)
      .parse(binaryParser)
      .buffer();
    expect(response).to.have.status(StatusCodes.OK);
    authRequest.isDone();

    responseZips = await loadAsync(response.body as string);
  });

  after(async () => {
    await Server.stop();
    await cleanup();
    sandbox.restore();
  });

  describe('settings.csv', () => {
    let receivedSettingsRows: CsvUserSettingsRow[];
    let expectedSettingsRows: CsvUserSettingsRow[];

    before(async () => {
      receivedSettingsRows = await loadReceivedCsv<CsvUserSettingsRow>(
        expectAndReturnSettingsCsvFile(responseZips.files)
      );

      expectedSettingsRows = await loadFixtureCsv<CsvUserSettingsRow>(
        'settings.csv'
      );
    });

    it('should match the given csv data', () => {
      expect(receivedSettingsRows).to.deep.equal(expectedSettingsRows);
    });

    it('should match the given csv data for field "Proband"', () => {
      const mapper = getFieldMapper<CsvUserSettingsRow>('Proband');
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Ergebnismitteilung"', () => {
      const mapper = getFieldMapper<CsvUserSettingsRow>(
        'Einwilligung Ergebnismitteilung'
      );
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Probenentnahme"', () => {
      const mapper = getFieldMapper<CsvUserSettingsRow>(
        'Einwilligung Probenentnahme'
      );
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Blutprobenentnahme"', () => {
      const mapper = getFieldMapper<CsvUserSettingsRow>(
        'Einwilligung Blutprobenentnahme'
      );
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Testproband"', () => {
      const mapper = getFieldMapper<CsvUserSettingsRow>('Testproband');
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });
  });

  describe('Legacy answers export', () => {
    let receivedLegacyAnswersRows: CsvLegacyAnswerRow[];
    let expectedLegacyAnswersRows: CsvLegacyAnswerRow[];

    before(async () => {
      receivedLegacyAnswersRows = await loadReceivedCsv<CsvLegacyAnswerRow>(
        expectAndReturnLegacyAnswersCsvFile(responseZips.files)
      );
      expectedLegacyAnswersRows = await loadFixtureCsv('legacy_answers.csv');
    });

    it('should match the given csv data', () => {
      expect(receivedLegacyAnswersRows).to.deep.equal(
        expectedLegacyAnswersRows
      );
    });

    it('should match the given csv data for field "Antwort"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Antwort');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Antwort_Datum"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Antwort_Datum');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "FB_Datum"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('FB_Datum');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Frage"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Frage');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Code"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Kodierung_Code');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Wert"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Kodierung_Wert');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Proband"', () => {
      const mapper = getFieldMapper<CsvLegacyAnswerRow>('Proband');
      expect(receivedLegacyAnswersRows.map(mapper)).to.deep.equal(
        expectedLegacyAnswersRows.map(mapper)
      );
    });
  });

  describe('Answers export', () => {
    let answerZips: JSZip;
    let receivedAnswersRows: {
      v1: CsvAnswerRow[];
      v2: CsvAnswerRow[];
      v3: CsvAnswerRow[];
      v4: CsvAnswerRow[];
      v5: CsvAnswerRow[];
      v6: CsvAnswerRow[];
      v7: CsvAnswerRow[];
    };
    let expectedAnswersRows: {
      v1: CsvAnswerRow[];
      v2: CsvAnswerRow[];
      v3: CsvAnswerRow[];
      v4: CsvAnswerRow[];
      v5: CsvAnswerRow[];
      v6: CsvAnswerRow[];
      v7: CsvAnswerRow[];
    };

    before(async () => {
      const questionnaires = [
        { id: 100000, version: 1 },
        { id: 100000, version: 2 },
        { id: 100000, version: 3 },
        { id: 100000, version: 4 },
        { id: 100000, version: 5 },
        { id: 100000, version: 6 },
        { id: 100000, version: 7 },
        { id: 200000, version: 1 },
        { id: 200000, version: 2 },
      ];

      const search: ExportOptions = {
        start_date: new Date('2000-01-01'),
        end_date: new Date('2999-01-01'),
        study_name: 'Answers Export',
        questionnaires,
        probands: ['answ-01', 'answ-02', 'answ-03', 'answ-04'],
        exports: ['answers'],
      };

      const authRequest = AuthServerMock.adminRealm().returnValid();

      const response: Response = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(search)
        .parse(binaryParser)
        .buffer();
      expect(response).to.have.status(StatusCodes.OK);
      authRequest.isDone();

      answerZips = await loadAsync(response.body as string);
      const answersCsv = expectAndReturnAnswerCsvFile(answerZips.files);

      receivedAnswersRows = {
        v1: await loadReceivedCsv<CsvAnswerRow>(answersCsv[0]),
        v2: await loadReceivedCsv<CsvAnswerRow>(answersCsv[1]),
        v3: await loadReceivedCsv<CsvAnswerRow>(answersCsv[2]),
        v4: await loadReceivedCsv<CsvAnswerRow>(answersCsv[3]),
        v5: await loadReceivedCsv<CsvAnswerRow>(answersCsv[4]),
        v6: await loadReceivedCsv<CsvAnswerRow>(answersCsv[5]),
        v7: await loadReceivedCsv<CsvAnswerRow>(answersCsv[6]),
      };

      expectedAnswersRows = {
        v1: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v1.csv'),
        v2: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v2.csv'),
        v3: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v3.csv'),
        v4: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v4.csv'),
        v5: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v5.csv'),
        v6: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v6.csv'),
        v7: await loadFixtureCsv<CsvAnswerRow>('answers_AE1_v7.csv'),
      };
    });

    it('should have the correct exported files', () => {
      expect(answerZips.files).to.have.property('files/90101-1px.jpeg');
      expect(answerZips.files).to.have.property('files/90102-file.pdf');
      expect(answerZips.files).to.have.property('files/90201-1px.jpeg');
      expect(answerZips.files).to.have.property('files/90202-file.pdf');
      expect(answerZips.files).not.to.have.property(
        'files/90103-should-not-show-up.jpeg'
      );
      expect(answerZips.files).not.to.have.property(
        'files/90203-should-not-show-up.jpeg'
      );
      expect(answerZips.files).not.to.have.property(
        'files/90104-should-not-show-up-too.jpeg'
      );
      expect(answerZips.files).not.to.have.property(
        'files/90105-should-not-show-up-too.jpeg'
      );
    });

    it('should not export questionnaire versions with no questionnaire instances', () => {
      expect(
        findFileByRegex(
          answerZips.files,
          /answers\/answers_AE2-Export-without-instance_v1_200000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/
        )
      ).to.be.undefined;
      expect(
        findFileByRegex(
          answerZips.files,
          /answers\/answers_AE2-Export-with-instance_v2_200000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/
        )
      ).not.to.be.undefined;
    });

    it('should match fixture csv for AE1 v1', () => {
      expect(receivedAnswersRows.v1).to.deep.equal(expectedAnswersRows.v1);
    });

    it('should match fixture csv for AE1 v2', () => {
      expect(receivedAnswersRows.v2).to.deep.equal(expectedAnswersRows.v2);
    });

    it('should match fixture csv for AE1 v3', () => {
      expect(receivedAnswersRows.v3).to.deep.equal(expectedAnswersRows.v3);
    });

    it('should match fixture csv for AE1 v4', () => {
      expect(receivedAnswersRows.v4).to.deep.equal(expectedAnswersRows.v4);
    });

    it('should match fixture csv for AE1 v5', () => {
      expect(receivedAnswersRows.v5).to.deep.equal(expectedAnswersRows.v5);
    });

    it('should match fixture csv for AE1 v6', () => {
      expect(receivedAnswersRows.v6).to.deep.equal(expectedAnswersRows.v6);
    });

    it('should match fixture csv for AE1 v7', () => {
      expect(receivedAnswersRows.v7).to.deep.equal(expectedAnswersRows.v7);
    });
  });

  describe('Codebook export', () => {
    let recievedCodebooksRows: {
      FB1: CsvCodebookRow[];
      FB4v1: CsvCodebookRow[];
      FB4v2: CsvCodebookRow[];
      FB5: CsvCodebookRow[];
    };

    let expectedCodebooksRows: {
      FB1: CsvCodebookRow[];
      FB4v1: CsvCodebookRow[];
      FB4v2: CsvCodebookRow[];
      FB5: CsvCodebookRow[];
    };

    before(async () => {
      const [
        codebookFb1Csv,
        codebookFb4v1Csv,
        codebookFb4v2Csv,
        codebookFb5Csv,
      ] = expectAndReturnCodebookFiles(responseZips.files);

      recievedCodebooksRows = {
        FB1: await loadReceivedCsv<CsvCodebookRow>(codebookFb1Csv),
        FB4v1: await loadReceivedCsv<CsvCodebookRow>(codebookFb4v1Csv),
        FB4v2: await loadReceivedCsv<CsvCodebookRow>(codebookFb4v2Csv),
        FB5: await loadReceivedCsv<CsvCodebookRow>(codebookFb5Csv),
      };

      expectedCodebooksRows = {
        FB1: await loadFixtureCsv<CsvCodebookRow>('codebook_FB1.csv'),
        FB4v1: await loadFixtureCsv<CsvCodebookRow>('codebook_FB4v1.csv'),
        FB4v2: await loadFixtureCsv<CsvCodebookRow>('codebook_FB4v2.csv'),
        FB5: await loadFixtureCsv<CsvCodebookRow>('codebook_FB5.csv'),
      };
    });

    it('should ignore not requested questionnaire versions', () => {
      expect(responseZips.files).to.not.have.key(
        'codebook_Teststudie---Export_FB4-Versionierung-mit-Labels-Codes_v3.csv'
      );
    });

    it('should match fixture csv for FB1', () => {
      expect(recievedCodebooksRows.FB1).to.deep.equal(
        expectedCodebooksRows.FB1
      );
    });

    it('should match fixture csv for FB4v1', () => {
      expect(recievedCodebooksRows.FB4v1).to.deep.equal(
        expectedCodebooksRows.FB4v1
      );
    });

    it('should match fixture csv for FB4v2', () => {
      expect(recievedCodebooksRows.FB4v2).to.deep.equal(
        expectedCodebooksRows.FB4v2
      );
    });

    it('should match fixture csv for FB5', () => {
      expect(recievedCodebooksRows.FB5).to.deep.equal(
        expectedCodebooksRows.FB5
      );
    });
  });

  describe('Questionnaires export', () => {
    let recievedQuestionnairesRows: CsvQuestionnaireRow[];
    let expectedQuestionnaireRows: CsvQuestionnaireRow[];

    before(async () => {
      const questionnairesCsv = expectAndReturnQuestionnairesCsvFile(
        responseZips.files
      );

      recievedQuestionnairesRows = await loadReceivedCsv<CsvQuestionnaireRow>(
        questionnairesCsv
      );

      expectedQuestionnaireRows = await loadFixtureCsv<CsvQuestionnaireRow>(
        'questionnaires.csv'
      );
    });

    it('should match fixture csv for questionnaires', () => {
      expect(recievedQuestionnairesRows).to.deep.equal(
        expectedQuestionnaireRows
      );
    });
  });

  describe('README.pdf', () => {
    it('should be present', () => {
      expectReadmeFile(responseZips.files);
    });
  });
});

function binaryParser(
  res: Response,
  cb: (err: Error | null, body: Buffer) => void
): void {
  let data = '';
  res.setEncoding('binary');
  res.on('data', function (chunk: Buffer) {
    data += chunk;
  });
  res.on('end', function () {
    cb(null, Buffer.from(data, 'binary'));
  });
}

async function parseCsv<T>(content: string): Promise<T[]> {
  return (await csv.parse(content, {
    columns: true,
    delimiter: ';',
  })) as T[];
}

function getFieldMapper<T>(field: keyof T): (row: T) => T[keyof T] {
  return (row: T): T[keyof T] => {
    return row[field];
  };
}

async function loadReceivedCsv<T>(zipObject: JSZipObject): Promise<T[]> {
  return await parseCsv<T>(await zipObject.async('string'));
}

async function loadFixtureCsv<T>(filename: string): Promise<T[]> {
  filename = path
    .join(__dirname, 'exportContent.spec.data', filename)
    .toString();
  const fileContent = (await fs.readFile(filename)).toString();
  return await parseCsv<T>(fileContent);
}

function findFileByRegex(
  files: Record<string, JSZipObject>,
  regex: RegExp
): JSZipObject | undefined {
  const key = Object.keys(files).find((k) => k.match(regex));
  return files[key] as JSZipObject;
}

function expectAndReturnAnswerCsvFile(
  files: Record<string, JSZipObject>
): JSZipObject[] {
  const filesRegex = [
    /answers\/answers_AE1-Answer-Export_v1_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v2_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v3_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v4_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v5_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v6_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
    /answers\/answers_AE1-Answer-Export_v7_100000_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/,
  ];

  const zips = filesRegex.map((regex) => findFileByRegex(files, regex));

  expect(zips.filter((zip) => zip !== undefined).length).to.eq(zips.length);

  return zips;
}

function expectAndReturnQuestionnairesCsvFile(
  files: Record<string, JSZipObject>
): JSZipObject {
  const fileRegex =
    /questionnaire_settings_Teststudie - Export_(\d{4}-\d{2}-\d{2}T\d{2}\d{2})/;
  const zipObj = findFileByRegex(files, fileRegex);
  expect(zipObj).to.be.not.undefined;

  return zipObj;
}

function expectAndReturnFile(
  fileName: string,
  files: Record<string, JSZipObject>
): JSZipObject {
  const zipObj = files[fileName];
  expect(zipObj).to.be.not.undefined;

  return zipObj;
}

function expectAndReturnLegacyAnswersCsvFile(
  files: Record<string, JSZipObject>
): JSZipObject {
  return expectAndReturnFile('answers.csv', files);
}

function expectAndReturnSettingsCsvFile(
  files: Record<string, JSZipObject>
): JSZipObject {
  return expectAndReturnFile('settings.csv', files);
}

function expectReadmeFile(files: Record<string, JSZipObject>): void {
  expectAndReturnFile('README.pdf', files);
}

function expectAndReturnCodebookFiles(
  files: Record<string, JSZipObject>
): JSZipObject[] {
  const zips = [
    files['codebook_Teststudie---Export_FB1-alle-Antworttypen_v1.csv'],
    files[
      'codebook_Teststudie---Export_FB4-Versionierung-mit-Variablennamen-Codes_v1.csv'
    ],
    files[
      'codebook_Teststudie---Export_FB4-Versionierung-mit-Variablennamen-Codes_v2.csv'
    ],
    files[
      'codebook_Teststudie---Export_FB5-Bedingungen-Variablennamen-und-AeOeUessa_v1.csv'
    ],
  ];

  expect(files['codebook_Teststudie---Export_FB2-alle-Antworttypen-UT_v1.csv'])
    .to.not.be.undefined;

  expect(files['codebook_Teststudie---Export_FB3-morgen-expired_v1.csv']).to.not
    .be.undefined;

  expect(zips.filter((item) => item !== undefined).length).to.eq(zips.length);

  return zips;
}
