/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import sinon, { createSandbox } from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { cleanup, setup } from './probands.spec.data/setup.helper';
import { mockGetProbandAccountsByStudyName } from '../accountServiceRequestMock.helper.spec';
import { personaldataserviceClient } from '../../../src/clients/personaldataserviceClient';
import { PersonalDataInternalDtoGet } from '@pia-system/lib-http-clients-internal';
import { PendingPersonalDataDeletion } from '@pia-system/lib-http-clients-internal/dist/dtos/pendingDeletion';

chai.use(chaiHttp);
chai.use(sinonChai);

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut1@example.com',
  studies: ['QTestStudy1'],
});
const ewHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'ew1@example.com',
  studies: ['QTestStudy1'],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher1@example.com',
  studies: ['QTestStudy1'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin1',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudy1'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/admin/studies/{studyName}/probands/export', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    AuthServerMock.probandRealm().returnValid();
    AuthServerMock.adminRealm().returnValid();
    await setup();
  });

  afterEach(async function () {
    AuthServerMock.cleanAll();
    await cleanup();
    testSandbox.restore();
  });

  describe('GET /admin/studies/{studyName}/probands/export', () => {
    beforeEach(function () {
      const getPersonalDataMock = testSandbox.stub(
        personaldataserviceClient,
        'getPersonalData'
      );
      const getPendingDeletionsMock = testSandbox.stub(
        personaldataserviceClient,
        'getPendingPersonalDataDeletions'
      );
      getPersonalDataMock.resolves([
        {
          pseudonym: 'qtest-proband1',
          study: 'QTestStudy1',
        } as unknown as PersonalDataInternalDtoGet,
        {
          pseudonym: 'qtest-proband2',
          study: 'QTestStudy1',
        } as unknown as PersonalDataInternalDtoGet,
        {
          pseudonym: 'qtest-proband3',
          study: 'QTestStudy1',
        } as unknown as PersonalDataInternalDtoGet,
      ]);
      getPendingDeletionsMock.resolves([
        {
          proband_id: 'qtest-proband1',
          study: 'QTestStudy1',
        } as unknown as PendingPersonalDataDeletion,
      ]);

      mockGetProbandAccountsByStudyName(
        testSandbox,
        ['QTestStudy1'],
        ['qtest-proband1', 'qtest-proband2', 'qtest-proband3']
      );
    });

    it('should return 401 if no token is applied', async () => {
      const studyName = 'QTestStudy1';
      const response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands/export`);
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    const userRoles = [
      {
        role: 'Proband',
        header: probandHeader,
      },
      {
        role: 'Sysadmin',
        header: sysadminHeader,
      },
      {
        role: 'Untersuchungsteam',
        header: utHeader,
      },
      {
        role: 'EinwilligungsManager',
        header: ewHeader,
      },
      {
        role: 'Forscher',
        header: forscherHeader,
      },
    ];
    userRoles.forEach(({ role, header }) => {
      it(`should return 403 if user is a ${role}`, async () => {
        const studyName = 'QTestStudy1';
        const response = await chai
          .request(apiAddress)
          .get(`/admin/studies/${studyName}/probands/export`)
          .set(header);
        expect(response).to.have.status(StatusCodes.FORBIDDEN);

        AuthServerMock.adminRealm().returnValid();
      });
    });

    it('should return 403 if proband manager is not in the study', async () => {
      const studyName = 'QTestStudy2';
      const response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands/export`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 200 if the fetching proband manager is in the study', async () => {
      const studyName = 'QTestStudy1';
      const response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands/export`)
        .set(pmHeader);

      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal({
        probandsExport:
          'pseudonym;study;anrede;titel;name;vorname;strasse;haus_nr;plz;landkreis;ort;telefon_privat;telefon_dienst;telefon_mobil;email;comment;ids;status;studyCenter;examinationWave;needsMaterial;firstLoggedInAt;complianceContact;complianceLabresults;complianceSamples;complianceBloodsamples;isTestProband;accountStatus;deactivatedAt;deletedAt;pending_compliance_change_labresults_to;pending_compliance_change_samples_to;pending_compliance_change_bloodsamples_to;pending_personal_data_deletion;pending_proband_deletion\nqtest-proband1;QTestStudy1;;;;;;;;;;;;;;;;active;;1;;;;1;1;1;;account;;;;;;1;\nqtest-proband4;QTestStudy1;;;;;;;;;;;;;;;;active;;1;;;;1;1;1;;no_account;;;;;;;\n',
      });
    });
  });
});
