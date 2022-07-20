/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import { StatusCodes } from 'http-status-codes';

import { default as Client } from 'ssh2-sftp-client';

import { LabResultImportHelper } from '../../src/services/labResultImportHelper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

import { db } from '../../src/db';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = `http://localhost:${config.public.port}`;

const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: [],
});

const client = new Client();
const sftpConfig = config.servers.hziftpserver;

describe('CSV Labresult import test', function () {
  before(async () => {
    const startServerSandbox = sinon.createSandbox();
    startServerSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    startServerSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    await Server.init();
    startServerSandbox.restore();
    await client.connect(sftpConfig).catch((err) => {
      console.error(
        `Could not connect to ${sftpConfig.host}:${sftpConfig.port}`,
        err
      );
    });
    AuthServerMock.adminRealm().returnValid();
  });

  after(async function () {
    AuthServerMock.cleanAll();
    await client.end();
    await Server.stop();
  });

  beforeEach(async function () {
    await client.put(
      './tests/integration/csvImport.spec.data/Laborergebnis_Bsp.csv',
      '/upload/Laborergebnis_Bsp.csv'
    );

    await db.none("INSERT INTO studies (name) VALUES ('QTestStudy')");
    await db.none(
      "INSERT INTO probands (pseudonym, study) VALUES ('qtest-proband1', 'QTestStudy')"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('X-1283855', 'qtest-proband1', 'new', FALSE)"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('X-1283858', 'qtest-proband1', 'new', FALSE)"
    );
  });

  afterEach(async function () {
    await client
      .delete('/upload/Laborergebnis_Bsp.csv', true)
      .catch((err) => console.error(err));

    await db.none(
      "DELETE FROM lab_results WHERE user_id LIKE 'qtest%' OR id='X-1283855'  OR id ='X-1283858'"
    );
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'qtest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  const timeout = 10000;
  it('should import csv files with correct fields and correct Proband into database', async function () {
    const result = await chai
      .request(apiAddress)
      .post('/admin/labResultsImport')
      .set(pmHeader);
    expect(result).to.have.status(StatusCodes.OK);
    expect(result.text).to.equal('success');

    const labResults = await db.manyOrNone(
      "SELECT * FROM lab_results WHERE user_id='qtest-proband1' ORDER BY id"
    );
    const lab_observations = await db.manyOrNone(
      "SELECT * FROM lab_observations WHERE lab_result_id IN (SELECT id FROM lab_results WHERE user_id='qtest-proband1') ORDER BY lab_result_id, name_id"
    );

    const expectedLabResultsLength = 2;
    expect(labResults).to.have.lengthOf(expectedLabResultsLength);
    expect(labResults[0]).to.include({
      id: 'X-1283855',
      user_id: 'qtest-proband1',
      status: 'analyzed',
    });
    expect(labResults[1]).to.include({
      id: 'X-1283858',
      user_id: 'qtest-proband1',
      status: 'analyzed',
    });

    const expectedLabObservationsLength = 7;
    expect(lab_observations).to.have.lengthOf(expectedLabObservationsLength);

    expect(lab_observations[0]).to.not.include({
      id: undefined,
      date_of_analysis: undefined,
      date_of_delivery: undefined,
      date_of_announcement: undefined,
    });
    expect(lab_observations[0]).to.not.include({
      id: null,
      date_of_analysis: null,
      date_of_delivery: null,
      date_of_announcement: null,
    });

    expect(lab_observations[0]).to.include({
      lab_result_id: 'X-1283855',
      name_id: 0,
      name: 'Antikörper (IgG) gegen SARS-CoV-2',
      result_string: 'negativ',
      result_value: '0,7',
      unit: '.',
      other_unit: 'ratio',
      kit_name: 'Euroimmun Anti-SARS-CoV-2-ELISA (IgG)',
      comment: '.',
      lab_name: 'Plauen',
      material: 'Vollblut',
    });

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(lab_observations[4]).to.not.include({
      id: undefined,
      date_of_analysis: undefined,
      date_of_delivery: undefined,
      date_of_announcement: undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(lab_observations[4]).to.not.include({
      id: null,
      date_of_analysis: null,
      date_of_delivery: null,
      date_of_announcement: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(lab_observations[4]).to.include({
      lab_result_id: 'X-1283858',
      name_id: 0,
      name: 'Antikörper (IgG) gegen SARS-CoV-6',
      result_string: 'grenzwertig',
      result_value: '12,00',
      unit: 'AU/ml',
      other_unit: '.',
      kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
      comment: 'nicht an den Probanden, nicht befundet',
      lab_name: 'Plauen',
      material: 'Vollblut',
    });
  }).timeout(timeout);
});
