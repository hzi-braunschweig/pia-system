/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import * as chai from 'chai';
import { setup, cleanup } from './export.spec.data/setup.helper';
import * as zip from 'jszip';
import * as fs from 'fs/promises';
import * as path from 'path';
import csvParse from 'csv-parse/lib/sync';
import { StatusCodes } from 'http-status-codes';

import chaiHttp from 'chai-http';

import { Response } from 'superagent';

import secretOrPrivateKey from '../secretOrPrivateKey';
import JWT from 'jsonwebtoken';
import server from '../../src/server';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${
  process.env['PORT'] ?? '80'
}/questionnaire`;

const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QExportTestForscher',
};

const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherHeader1 = { authorization: forscherToken1 };

interface AnswerRow {
  Antwort: string;
  Antwort_Datum: string;
  FB_Datum: string;
  Frage: string;
  Kodierung_Code: string;
  Kodierung_Wert: string;
  Proband: string;
}

interface SettingRow {
  Proband: string;
  'Benachrichtigung Uhrzeit': string;
  'Einwilligung Ergebnismitteilung': string;
  'Einwilligung Probenentnahme': string;
  'Einwilligung Blutprobenentnahme': string;
  Testproband: string;
}

const binaryParser = function (
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
};

function convertDate(date?: string): string {
  if (!date) {
    return '';
  }
  return date.replace(/,/g, '');
}

function convertArray(array?: string): string {
  if (!array) {
    return '';
  }
  return array.replace(/"/g, '');
}

function convertAnswerRow(row: AnswerRow): AnswerRow {
  return {
    Antwort: row.Antwort,
    Antwort_Datum: convertDate(row.Antwort_Datum),
    FB_Datum: convertDate(row.FB_Datum),
    Frage: row.Frage,
    Kodierung_Code: convertArray(row.Kodierung_Code),
    Kodierung_Wert: row.Kodierung_Wert,
    Proband: row.Proband,
  };
}

async function loadAnswersCsv(content: string): Promise<AnswerRow[]> {
  const rows = (await csvParse(content)) as AnswerRow[];
  return rows.map(convertAnswerRow);
}

async function loadSettingsCsv(content: string): Promise<SettingRow[]> {
  return (await csvParse(content)) as SettingRow[];
}

function getFieldMapper<T>(field: keyof T): (row: T) => T[keyof T] {
  return (row: T): T[keyof T] => {
    return row[field];
  };
}

const questionnaire1 = 295;
const questionnaire2 = 297;
const questionnaire3 = 298;
const questionnaire4 = 299;

describe('/dataExport/searches content should match the expected csv', function () {
  let receivedAnswersRows: AnswerRow[];
  let expectedAnswersRows: AnswerRow[];

  let receivedSettingsRows: SettingRow[];
  let expectedSettingsRows: SettingRow[];

  before(async () => {
    await server.init();
    await setup();

    const questionnaires = [
      questionnaire1,
      questionnaire2,
      questionnaire3,
      questionnaire4,
    ];

    const search = {
      start_date: new Date('2000-01-01'),
      end_date: new Date('2999-01-01'),
      study_name: 'Teststudie - Export',
      questionnaires,
      probands: [
        'Rtest-0000000002',
        'Rtest-0000000003',
        'Rtest-0000000004',
        'Rtest-0000000005',
        'Rtest-0000000006',
      ],
      exportAnswers: true,
      exportLabResults: true,
      exportSamples: true,
      exportSettings: true,
    };

    const response = await chai
      .request(apiAddress)
      .post('/dataExport/searches')
      .set(forscherHeader1)
      .send(search)
      .parse(binaryParser)
      .buffer();
    expect(response).to.have.status(StatusCodes.OK);

    const result = await zip.loadAsync(response.body);
    const answersCsv = result.files['answers.csv'];
    const settingsCsv = result.files['settings.csv'];

    expect(answersCsv).to.be.not.undefined;
    expect(settingsCsv).to.be.not.undefined;

    if (!answersCsv || !settingsCsv) {
      throw new Error();
    }

    const receivedAnswers = await answersCsv.async('string');
    const expectedAnswersFileName: string = path
      .join(__dirname, 'export.spec.data', 'answers.csv')
      .toString();
    const expectedAnswers = await fs.readFile(expectedAnswersFileName);

    const receivedSettings = await settingsCsv.async('string');
    const expectedSettingsFileName: string = path
      .join(__dirname, 'export.spec.data', 'settings.csv')
      .toString();
    const expectedSettings = await fs.readFile(expectedSettingsFileName);

    receivedAnswersRows = await loadAnswersCsv(receivedAnswers);
    expectedAnswersRows = await loadAnswersCsv(expectedAnswers.toString());

    receivedSettingsRows = await loadSettingsCsv(receivedSettings);
    expectedSettingsRows = await loadSettingsCsv(expectedSettings.toString());
  });

  after(async () => {
    await server.stop();
    await cleanup();
  });

  describe('settings.csv', () => {
    it('should match the given csv data', () => {
      expect(receivedSettingsRows).to.deep.equal(expectedSettingsRows);
    });

    it('should match the given csv data for field "Proband"', () => {
      const mapper = getFieldMapper<SettingRow>('Proband');
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Benachrichtigung Uhrzeit"', () => {
      const mapper = getFieldMapper<SettingRow>('Benachrichtigung Uhrzeit');
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Ergebnismitteilung"', () => {
      const mapper = getFieldMapper<SettingRow>(
        'Einwilligung Ergebnismitteilung'
      );
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Probenentnahme"', () => {
      const mapper = getFieldMapper<SettingRow>('Einwilligung Probenentnahme');
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Einwilligung Blutprobenentnahme"', () => {
      const mapper = getFieldMapper<SettingRow>(
        'Einwilligung Blutprobenentnahme'
      );
      expect(receivedSettingsRows.map(mapper)).to.deep.equal(
        expectedSettingsRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Testproband"', () => {
      const mapper = getFieldMapper<SettingRow>('Testproband');
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
      const mapper = getFieldMapper<AnswerRow>('Antwort');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Antwort_Datum"', () => {
      const mapper = getFieldMapper<AnswerRow>('Antwort_Datum');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "FB_Datum"', () => {
      const mapper = getFieldMapper<AnswerRow>('FB_Datum');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Frage"', () => {
      const mapper = getFieldMapper<AnswerRow>('Frage');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Code"', () => {
      const mapper = getFieldMapper<AnswerRow>('Kodierung_Code');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Kodierung_Wert"', () => {
      const mapper = getFieldMapper<AnswerRow>('Kodierung_Wert');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });

    it('should match the given csv data for field "Proband"', () => {
      const mapper = getFieldMapper<AnswerRow>('Proband');
      expect(receivedAnswersRows.map(mapper)).to.deep.equal(
        expectedAnswersRows.map(mapper)
      );
    });
  });
});
