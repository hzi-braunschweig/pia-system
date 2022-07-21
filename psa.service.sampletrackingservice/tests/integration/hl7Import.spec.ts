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

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

import { LabResultImportHelper } from '../../src/services/labResultImportHelper';

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
const sftpConfig = config.servers.mhhftpserver;

describe('HL7 Labresult import test', function () {
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
      './tests/integration/hl7Import.spec.data/M1',
      '/upload/M1'
    );
    await client.put(
      './tests/integration/hl7Import.spec.data/M2-error',
      '/upload/M2-error'
    );
    await client.put(
      './tests/integration/hl7Import.spec.data/M3',
      '/upload/M3'
    );

    await db.none("INSERT INTO studies(name) VALUES ('QTestStudy')");
    await db.none(
      "INSERT INTO probands (pseudonym, study) VALUES ('qtest-proband1', 'QTestStudy')"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('TEST-12345679012', 'qtest-proband1', 'new', FALSE)"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('TEST-12345679013', 'qtest-proband1', 'new', FALSE)"
    );
  });

  afterEach(async function () {
    await client.delete('/upload/M1', true).catch((err) => console.error(err));
    await client
      .delete('/upload/M2-error', true)
      .catch((err) => console.error(err));
    await client.delete('/upload/M3', true).catch((err) => console.error(err));

    await db.none(
      "DELETE FROM lab_results WHERE user_id LIKE 'qtest%' OR id='TEST-12345679012'  OR id ='TEST-12345679013'"
    );
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'qtest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  const timeout = 10000;

  it('should import hl7 files with correct fields and correct Proband into database', async function () {
    const result = await chai
      .request(apiAddress)
      .post('/admin/labResultsImport')
      .set(pmHeader);
    expect(result).to.have.status(StatusCodes.OK);
    expect(result.text).to.equal('success');

    const labResults = await db.many(
      'SELECT * FROM lab_results WHERE user_id=$1 ORDER BY id',
      ['qtest-proband1']
    );
    const lab_observations = await db.many(
      'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1) ORDER BY lab_result_id, name_id',
      ['qtest-proband1']
    );

    const expectedLabResultsLength = 2;

    expect(labResults).to.have.lengthOf(expectedLabResultsLength);

    expect(labResults[0]).to.include({
      id: 'TEST-12345679012',
      user_id: 'qtest-proband1',
      status: 'analyzed',
    });

    expect(labResults[1]).to.include({
      id: 'TEST-12345679013',
      user_id: 'qtest-proband1',
      status: 'analyzed',
    });

    const expectedLabObservationsLength = 20;

    expect(lab_observations.length).to.equal(expectedLabObservationsLength);

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

    expect(lab_observations[0]).to.deep.include({
      lab_result_id: 'TEST-12345679012',
      name_id: 521035,
      name: 'Adenovirus-PCR (resp.)',
      result_string: 'negativ',
      result_value: null,
      comment:
        'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
    });

    expect(lab_observations[1]).to.not.include({
      id: undefined,
      date_of_analysis: undefined,
      date_of_delivery: undefined,
      date_of_announcement: undefined,
    });
    expect(lab_observations[1]).to.not.include({
      id: null,
      date_of_analysis: null,
      date_of_delivery: null,
      date_of_announcement: null,
    });

    expect(lab_observations[1]).to.deep.include({
      lab_result_id: 'TEST-12345679012',
      name_id: 521036,
      name: 'HMPV-NAT',
      result_string: 'positiv',
      result_value: '33',
      comment:
        'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
    });
  }).timeout(timeout);
});
