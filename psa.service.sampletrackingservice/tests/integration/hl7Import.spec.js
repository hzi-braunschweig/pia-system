/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const Client = require('ssh2-sftp-client');
const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const { config } = require('../../src/config');

const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT + '/sample';

const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmHeader = { authorization: pmToken };

const { db } = require('../../src/db');
const sinon = require('sinon');
const {
  LabResultImportHelper,
} = require('../../src/services/labResultImportHelper');
const client = new Client();
const sftpConfig = config.servers.mhhftpserver;

describe('HL7 Labresult import test', function () {
  before(async () => {
    const startServerSandbox = sinon.createSandbox();
    startServerSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    startServerSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    await server.init();
    startServerSandbox.restore();
    await client.connect(sftpConfig).catch((err) => {
      console.error(
        `Could not connect to ${sftpConfig.host}:${sftpConfig.port}`,
        err
      );
    });
  });

  after(async function () {
    await client.end();
    await server.stop();
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
      "INSERT INTO probands (pseudonym, study) VALUES ('QTestProband1', 'QTestStudy')"
    );
    await db.none(
      "INSERT INTO accounts (username, password, role) VALUES ('QTestProbandenManager', '', 'ProbandenManager')"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('TEST-12345679012', 'QTestProband1', 'new', FALSE)"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('TEST-12345679013', 'QTestProband1', 'new', FALSE)"
    );
  });

  afterEach(async function () {
    await client.delete('/upload/M1', true).catch((err) => console.error(err));
    await client
      .delete('/upload/M2-error', true)
      .catch((err) => console.error(err));
    await client.delete('/upload/M3', true).catch((err) => console.error(err));

    await db.none(
      "DELETE FROM lab_results WHERE user_id LIKE 'QTest%' OR id='TEST-12345679012'  OR id ='TEST-12345679013'"
    );
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'QTest%'");
    await db.none("DELETE FROM accounts WHERE username LIKE 'QTest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  it('should import hl7 files with correct fields and correct Proband into database', async function () {
    this.timeout(10000);

    const result = await chai
      .request(apiAddress)
      .post('/labResultsImport')
      .set(pmHeader);
    expect(result).to.have.status(200);
    expect(result.text).to.equal('success');

    const labResults = await db.many(
      'SELECT * FROM lab_results WHERE user_id=$1 ORDER BY id',
      ['QTestProband1']
    );
    const lab_observations = await db.many(
      'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1) ORDER BY lab_result_id, name_id',
      ['QTestProband1']
    );

    expect(labResults.length).to.equal(2);

    expect(labResults[0].id).to.equal('TEST-12345679012');
    expect(labResults[0].user_id).to.equal('QTestProband1');
    expect(labResults[0].status).to.equal('analyzed');

    expect(labResults[1].id).to.equal('TEST-12345679013');
    expect(labResults[1].user_id).to.equal('QTestProband1');
    expect(labResults[1].status).to.equal('analyzed');

    expect(lab_observations.length).to.equal(20);

    expect(lab_observations[0].id).to.not.equal(undefined);
    expect(lab_observations[0].id).to.not.equal(null);
    expect(lab_observations[0].lab_result_id).to.equal('TEST-12345679012');
    expect(lab_observations[0].name_id).to.equal(521035);
    expect(lab_observations[0].name).to.equal('Adenovirus-PCR (resp.)');
    expect(lab_observations[0].result_string).to.equal('negativ');
    expect(lab_observations[0].result_value).to.equal(null);
    expect(lab_observations[0].date_of_analysis).to.not.equal(null);
    expect(lab_observations[0].date_of_analysis).to.not.equal(undefined);
    expect(lab_observations[0].date_of_delivery).to.not.equal(null);
    expect(lab_observations[0].date_of_delivery).to.not.equal(undefined);
    expect(lab_observations[0].date_of_announcement).to.not.equal(null);
    expect(lab_observations[0].date_of_announcement).to.not.equal(undefined);
    expect(lab_observations[0].comment).to.equal(
      'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.'
    );

    expect(lab_observations[1].id).to.not.equal(undefined);
    expect(lab_observations[1].id).to.not.equal(null);
    expect(lab_observations[1].lab_result_id).to.equal('TEST-12345679012');
    expect(lab_observations[1].name_id).to.equal(521036);
    expect(lab_observations[1].name).to.equal('HMPV-NAT');
    expect(lab_observations[1].result_string).to.equal('positiv');
    expect(lab_observations[1].result_value).to.equal('33');
    expect(lab_observations[1].date_of_analysis).to.not.equal(null);
    expect(lab_observations[1].date_of_analysis).to.not.equal(undefined);
    expect(lab_observations[1].date_of_delivery).to.not.equal(null);
    expect(lab_observations[1].date_of_delivery).to.not.equal(undefined);
    expect(lab_observations[1].date_of_announcement).to.not.equal(null);
    expect(lab_observations[1].date_of_announcement).to.not.equal(undefined);
    expect(lab_observations[1].comment).to.equal(
      'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.'
    );
  });
});
