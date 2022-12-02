/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createSandbox } from 'sinon';
import JSZip, * as zip from 'jszip';
import * as csv from 'csv-parse/sync';
import { StatusCodes } from 'http-status-codes';
import { Response } from 'superagent';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import {
  CsvAnswerRow,
  CsvBloodSampleRow,
  CsvLabResultObservationRow,
  CsvSampleRow,
  CsvUserSettingsRow,
} from '../../src/models/csvExportRows';
import { cleanup, setup } from './export.ids.spec.data/setup.helper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { userserviceClient } from '../../src/clients/userserviceClient';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-exportforscher',
  studies: ['Teststudie - Export'],
});

const questionnaire = { id: 297, version: 1 };

describe('/export should work with ids field', function () {
  const sandbox = createSandbox();

  let receivedAnswersRows: CsvAnswerRow[];
  let receivedSettingsRows: CsvUserSettingsRow[];
  let receivedBloodSamplesRows: CsvBloodSampleRow[];
  let receivedSamplesRows: CsvSampleRow[];
  let receivedLabResultsRows: CsvLabResultObservationRow[];

  before(async () => {
    await Server.init();
    await setup();

    sandbox
      .stub(userserviceClient, 'getPseudonyms')
      .resolves(['test-1', 'test-ids2']);

    const authRequest = AuthServerMock.adminRealm().returnValid();

    const search = {
      start_date: new Date('2000-01-01'),
      end_date: new Date('2999-01-01'),
      study_name: 'Teststudie - Export',
      questionnaires: [questionnaire],
      probands: ['test-1', 'test-ids2'],
      exports: [
        'answers',
        'labresults',
        'samples',
        'bloodsamples',
        'settings',
        'codebook',
      ],
    };

    const response = await chai
      .request(apiAddress)
      .post('/admin/export')
      .set(forscherHeader1)
      .send(search)
      .parse(binaryParser)
      .buffer();
    expect(response).to.have.status(StatusCodes.OK);
    authRequest.isDone();

    const result = await zip.loadAsync(response.body as string);

    receivedAnswersRows = await loadCsv(result, 'answers.csv');
    receivedSettingsRows = await loadCsv(result, 'settings.csv');
    receivedBloodSamplesRows = await loadCsv(result, 'blood_samples.csv');
    receivedSamplesRows = await loadCsv(result, 'samples.csv');
    receivedLabResultsRows = await loadCsv(result, 'lab_results.csv');
  });

  after(async () => {
    await Server.stop();
    await cleanup();
    sandbox.restore();
  });

  describe('settings.csv', () => {
    it('should match the given data', () => {
      const expected = [
        {
          Proband: 'test-1',
          'Einwilligung Ergebnismitteilung': 'Nein',
          'Einwilligung Probenentnahme': 'Nein',
          'Einwilligung Blutprobenentnahme': 'Nein',
          Testproband: 'Nein',
          IDS: 'test-ids',
        },
        {
          Proband: '',
          'Einwilligung Ergebnismitteilung': 'Nein',
          'Einwilligung Probenentnahme': 'Nein',
          'Einwilligung Blutprobenentnahme': 'Nein',
          Testproband: 'Nein',
          IDS: 'test-ids2',
        },
      ];

      expect(receivedSettingsRows).to.deep.equal(expected);
    });
  });

  describe('answers.csv', () => {
    it('should match the given data', () => {
      const expected = [
        {
          Antwort: 'gelb;blau;',
          Antwort_Datum: '.',
          FB_Datum: '08.06.2021, 00:00',
          Frage: 'FB2_alle_Antworttypen_UT_v1_f1_1_a2',
          Kodierung_Code: '["1","0"]',
          Kodierung_Wert: '["Ja","Nein"]',
          Proband: 'test-1',
          IDS: 'test-ids',
        },
        {
          Antwort: 'gelb;blau;',
          Antwort_Datum: '.',
          FB_Datum: '08.06.2021, 00:00',
          Frage: 'FB2_alle_Antworttypen_UT_v1_f1_1_a2',
          Kodierung_Code: '["1","0"]',
          Kodierung_Wert: '["Ja","Nein"]',
          Proband: '',
          IDS: 'test-ids2',
        },
      ];

      expect(receivedAnswersRows).to.deep.equal(expected);
    });
  });

  describe('blood_samples.csv', () => {
    it('should match the given data', () => {
      const expected = [
        {
          Bemerkung: 'TEST',
          Blutproben_ID: '1',
          Status: 'genommen',

          Proband: 'test-1',
          IDS: 'test-ids',
        },
        {
          Bemerkung: 'TEST',
          Blutproben_ID: '2',
          Status: 'genommen',

          Proband: '',
          IDS: 'test-ids2',
        },
      ];

      expect(receivedBloodSamplesRows).to.deep.equal(expected);
    });
  });

  describe('samples.csv', () => {
    it('should match the given data', () => {
      const expected = [
        {
          Bakt_Proben_ID: '0',
          Bemerkung: 'TEST',
          Proben_ID: '1',
          Status: 'analysiert',

          Proband: 'test-1',
          IDS: 'test-ids',
        },
        {
          Bakt_Proben_ID: '0',
          Bemerkung: 'TEST',
          Proben_ID: '2',
          Status: 'analysiert',

          Proband: '',
          IDS: 'test-ids2',
        },
      ];

      expect(receivedSamplesRows).to.deep.equal(expected);
    });
  });

  describe('lab_results.csv', () => {
    it('should match the given data', () => {
      const expected = [
        {
          Arzt: '.',
          Auftragsnr: '',
          Bericht_ID: '1',
          'CT-Wert': 'test',
          Datum_Abnahme: '01.01.2010, 00:00',
          Datum_Analyse: '.',
          Datum_Eingang: '.',
          Datum_Mitteilung: '.',
          Ergebnis: '',
          Kommentar: 'test',
          PCR: 'test1',
          PCR_ID: '1',

          Proband: 'test-1',
          IDS: 'test-ids',
        },
        {
          Arzt: '.',
          Auftragsnr: '',
          Bericht_ID: '2',
          'CT-Wert': 'test',
          Datum_Abnahme: '01.01.2010, 00:00',
          Datum_Analyse: '.',
          Datum_Eingang: '.',
          Datum_Mitteilung: '.',
          Ergebnis: '',
          Kommentar: 'test',
          PCR: 'test2',
          PCR_ID: '2',

          Proband: '',
          IDS: 'test-ids2',
        },
      ];

      expect(receivedLabResultsRows).to.deep.equal(expected);
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

async function loadCsv<T>(zipFile: JSZip, name: string): Promise<T[]> {
  // eslint-disable-next-line security/detect-object-injection
  const file = zipFile.files[name];
  if (!file) {
    throw new Error(`Could not find file "${name}" in zip archive.`);
  }
  const content = await file.async('string');
  return (await csv.parse(content, { columns: true, delimiter: ';' })) as T[];
}
