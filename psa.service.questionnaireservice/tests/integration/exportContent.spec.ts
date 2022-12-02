/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable security/detect-object-injection,security/detect-non-literal-fs-filename */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as zip from 'jszip';
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
  studies: ['Teststudie - Export'],
});

describe('/export content should match the expected csv', function () {
  const sandbox = createSandbox();

  let receivedAnswersRows: CsvAnswerRow[];
  let expectedAnswersRows: CsvAnswerRow[];

  let receivedSettingsRows: CsvUserSettingsRow[];
  let expectedSettingsRows: CsvUserSettingsRow[];

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
    await Server.init();
    await setup();

    sandbox
      .stub(userserviceClient, 'getPseudonyms')
      .resolves([
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
      exports: ['answers', 'labresults', 'samples', 'settings', 'codebook'],
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

    const result = await zip.loadAsync(response.body as string);
    const answersCsv = result.files['answers.csv'];
    const settingsCsv = result.files['settings.csv'];
    const codebookFb1Csv =
      result.files['codebook_Teststudie---Export_FB1-alle-Antworttypen_v1.csv'];
    const codebookFb2Csv =
      result.files[
        'codebook_Teststudie---Export_FB2-alle-Antworttypen-UT_v1.csv'
      ];
    const codebookFb3Csv =
      result.files['codebook_Teststudie---Export_FB3-morgen-expired_v1.csv'];
    const codebookFb4v1Csv =
      result.files[
        'codebook_Teststudie---Export_FB4-Versionierung-mit-Labels-Codes_v1.csv'
      ];
    const codebookFb4v2Csv =
      result.files[
        'codebook_Teststudie---Export_FB4-Versionierung-mit-Labels-Codes_v2.csv'
      ];
    const codebookFb5Csv =
      result.files[
        'codebook_Teststudie---Export_FB5-Bedingungen-Labels-und-AeOeUessa_v1.csv'
      ];

    expect(answersCsv).to.be.not.undefined;
    expect(settingsCsv).to.be.not.undefined;
    expect(codebookFb1Csv).to.be.not.undefined;
    expect(codebookFb2Csv).to.be.not.undefined;
    expect(codebookFb3Csv).to.be.not.undefined;
    expect(codebookFb4v1Csv).to.be.not.undefined;
    expect(codebookFb4v2Csv).to.be.not.undefined;
    expect(codebookFb5Csv).to.be.not.undefined;
    expect(result.files).to.not.have.key(
      'codebook_Teststudie---Export_FB4-Versionierung-mit-Labels-Codes_v3.csv'
    );

    if (!answersCsv || !settingsCsv) {
      throw new Error();
    }

    const receivedAnswers = await answersCsv.async('string');
    const expectedAnswersFileName: string = path
      .join(__dirname, 'exportContent.spec.data', 'answers.csv')
      .toString();
    const expectedAnswers = await fs.readFile(expectedAnswersFileName);

    const receivedSettings = await settingsCsv.async('string');
    const expectedSettingsFileName: string = path
      .join(__dirname, 'exportContent.spec.data', 'settings.csv')
      .toString();
    const expectedSettings = await fs.readFile(expectedSettingsFileName);

    receivedAnswersRows = await loadAnswersCsv(receivedAnswers);
    expectedAnswersRows = await loadAnswersCsv(expectedAnswers.toString());

    receivedSettingsRows = await loadSettingsCsv(receivedSettings);
    expectedSettingsRows = await loadSettingsCsv(expectedSettings.toString());

    recievedCodebooksRows = {
      FB1: await loadCodebookCsv(await codebookFb1Csv.async('string')),
      FB4v1: await loadCodebookCsv(await codebookFb4v1Csv.async('string')),
      FB4v2: await loadCodebookCsv(await codebookFb4v2Csv.async('string')),
      FB5: await loadCodebookCsv(await codebookFb5Csv.async('string')),
    };

    const expectedCodebookFB1: string = path
      .join(__dirname, 'exportContent.spec.data', 'codebook_FB1.csv')
      .toString();
    const expectedCodebookFB4v1: string = path
      .join(__dirname, 'exportContent.spec.data', 'codebook_FB4v1.csv')
      .toString();
    const expectedCodebookFB4v2: string = path
      .join(__dirname, 'exportContent.spec.data', 'codebook_FB4v2.csv')
      .toString();
    const expectedCodebookFB5: string = path
      .join(__dirname, 'exportContent.spec.data', 'codebook_FB5.csv')
      .toString();

    expectedCodebooksRows = {
      FB1: await loadCodebookCsv(
        (await fs.readFile(expectedCodebookFB1)).toString()
      ),
      FB4v1: await loadCodebookCsv(
        (await fs.readFile(expectedCodebookFB4v1)).toString()
      ),
      FB4v2: await loadCodebookCsv(
        (await fs.readFile(expectedCodebookFB4v2)).toString()
      ),
      FB5: await loadCodebookCsv(
        (await fs.readFile(expectedCodebookFB5)).toString()
      ),
    };
  });

  after(async () => {
    await Server.stop();
    await cleanup();
    sandbox.restore();
  });

  describe('settings.csv', () => {
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

  describe('answers.csv', () => {
    it('should match the given csv data', () => {
      expect(receivedAnswersRows).to.deep.equal(expectedAnswersRows);
    });

    it('should match the given csv data for field "Antwort"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Antwort');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Antwort_Datum"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Antwort_Datum');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "FB_Datum"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('FB_Datum');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Frage"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Frage');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Code"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Kodierung_Code');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Wert"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Kodierung_Wert');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Proband"', () => {
      const mapper = getFieldMapper<CsvAnswerRow>('Proband');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });
  });

  describe('codebook.csv', () => {
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

function convertDate(date?: string): string {
  if (!date) {
    return '';
  }
  return date.replace(/,/g, '');
}

function convertArray(array?: string | string[]): string | string[] {
  if (!array) {
    return '';
  }
  if (typeof array !== 'string') {
    return array;
  }
  return array.replace(/"/g, '');
}

function convertAnswerRow(row: CsvAnswerRow): CsvAnswerRow {
  return {
    Antwort: row.Antwort,
    Antwort_Datum: convertDate(row.Antwort_Datum),
    FB_Datum: convertDate(row.FB_Datum),
    Frage: row.Frage,
    Kodierung_Code: convertArray(row.Kodierung_Code),
    Kodierung_Wert: row.Kodierung_Wert,
    Proband: row.Proband,
    IDS: undefined,
  };
}

function convertSettingsRow(row: CsvUserSettingsRow): CsvUserSettingsRow {
  return {
    Proband: row.Proband,
    IDS: undefined,
    'Einwilligung Ergebnismitteilung': row['Einwilligung Ergebnismitteilung'],
    'Einwilligung Probenentnahme': row['Einwilligung Probenentnahme'],
    'Einwilligung Blutprobenentnahme': row['Einwilligung Blutprobenentnahme'],
    Testproband: row.Testproband,
  };
}

async function loadAnswersCsv(content: string): Promise<CsvAnswerRow[]> {
  const rows = await parseCsv<CsvAnswerRow>(content);
  return rows.map(convertAnswerRow);
}

async function loadSettingsCsv(content: string): Promise<CsvUserSettingsRow[]> {
  const rows = await parseCsv<CsvUserSettingsRow>(content);
  return rows.map(convertSettingsRow);
}

async function loadCodebookCsv(content: string): Promise<CsvCodebookRow[]> {
  return await parseCsv<CsvCodebookRow>(content);
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
