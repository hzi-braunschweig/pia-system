/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import fetchMocker from 'fetch-mock';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { ModysImportService } from '../../src/services/modysImportService';
import { StatusCodes } from 'http-status-codes';
import {
  ContactDetailTypeId,
  VPersonContactDetailOverview,
  VPersonOverview,
} from '../../src/models/modysApi';

const expect = chai.expect;
chai.use(sinonChai);
const fetchMock = fetchMocker.sandbox();

const sandbox: SinonSandbox = createSandbox();

sandbox.restore();

describe('MODYS Import', () => {
  let fetchStub: SinonStub;

  beforeEach(() => {
    fetchStub = sandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
  });

  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();
  });

  it('should finish import if no pseudonyms were found for study', async () => {
    // Arrange
    mockGetExternalIds([]);

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchMock.calls().length).to.eq(1);
  });

  it('should request MODYS probands for given external IDs', async () => {
    // Arrange
    mockGetExternalIds(['TestProband1', 'TestProband2', 'TestProband3']);
    mockGetProbandIdentifierbyId();
    mockGetProbandWithId();
    mockGetProbandContactDetails();
    mockUpdatePersonalData();
    const expectedCallCount = 13;

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchStub.callCount).to.eq(expectedCallCount);
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://externalmodys/api/pidByIdandType/TestProband1/1',
      {
        method: 'GET',
        headers: {
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://externalmodys/api/probands/MODYS_Proband',
      {
        method: 'GET',
        headers: {
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://externalmodys/api/probandContactDetails/MODYS_Proband',
      {
        method: 'GET',
        headers: {
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
  });

  it('should finish import if no probands were found in MODYS', async () => {
    // Arrange
    mockGetExternalIds(['TestProband1', 'TestProband2', 'TestProband3']);
    fetchMock.get('glob:http://externalmodys/api/pidByIdandType/*/1', {
      status: StatusCodes.NOT_FOUND,
    });
    const expectedCallCount = 4;

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchMock.calls().length).to.eq(expectedCallCount);
  });

  it('should update mapped probands in personaldataservice', async () => {
    // Arrange
    mockGetExternalIds(['TestProband1', 'TestProband2', 'TestProband3']);
    mockGetProbandIdentifierbyId();
    mockGetProbandWithId();
    mockGetProbandContactDetails();
    mockUpdatePersonalData();
    const expectedCallCount = 13;

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchMock.calls().length).to.eq(expectedCallCount);
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://personaldataservice:5000/personal/personalData/proband/testproband1',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anrede: 'Frau',
          titel: 'Prof. Dr.',
          name: 'Muster',
          vorname: 'Lisa',
          strasse: 'Hauptstraße',
          haus_nr: '15',
          plz: '12345',
          landkreis: 'Niedersachsen',
          ort: 'Hannover',
          telefon_privat: '0123-456789',
          telefon_dienst: undefined,
          telefon_mobil: undefined,
          email: 'mail@test',
        }),
      }
    );
  });

  it('should also finish if no personal data could be updated', async () => {
    // Arrange
    mockGetExternalIds(['TestProband1', 'TestProband2', 'TestProband3']);
    mockGetProbandIdentifierbyId();
    mockGetProbandWithId();
    mockGetProbandContactDetails();
    fetchMock.put(
      'glob:http://personaldataservice:5000/personal/personalData/proband/*',
      StatusCodes.NOT_FOUND
    );
    const expectedCallCount = 13;

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchMock.calls().length).to.eq(expectedCallCount);
  });

  function mockGetExternalIds(externalIds: string[]): void {
    fetchMock.get(
      'http://userservice:5000/user/externalIds?study=Teststudy&complianceContact=true',
      {
        status: StatusCodes.OK,
        body: externalIds.map((externalId) => ({
          pseudonym: externalId.toLowerCase(),
          externalId,
        })),
      }
    );
  }

  function mockGetProbandIdentifierbyId(): void {
    fetchMock.get('glob:http://externalmodys/api/pidByIdandType/*/1', {
      status: StatusCodes.OK,
      body: 'MODYS_Proband',
    });
  }

  function mockGetProbandWithId(): void {
    fetchMock.get('glob:http://externalmodys/api/probands/*', {
      status: StatusCodes.OK,
      body: createVPersonOverview(),
    });
  }

  function mockGetProbandContactDetails(): void {
    fetchMock.get('glob:http://externalmodys/api/probandContactDetails/*', {
      status: StatusCodes.OK,
      body: createVPersonContactDetailOverviewList(),
    });
  }

  function mockUpdatePersonalData(): void {
    fetchMock.put(
      'glob:http://personaldataservice:5000/personal/personalData/proband/*',
      StatusCodes.OK
    );
  }

  function createVPersonOverview(): VPersonOverview {
    return {
      cityName: 'Hannover',
      dayOfBirth: 12,
      firstname: 'Lisa',
      monthOfBirth: 5,
      name: 'Muster',
      personId: 'MODYS_Proband',
      postcode: '12345',
      salutation: 'Frau',
      stateFkLang: 'Niedersachsen',
      streetName: 'Hauptstraße',
      streetNumber: '15',
      title: 'Prof. Dr.',
      yearOfBirth: 1977,
    };
  }

  function createVPersonContactDetailOverviewList(): VPersonContactDetailOverview[] {
    return [
      {
        contactDetailTypeId: ContactDetailTypeId.TELEFON_PRIVAT,
        value: '0123-456789',
      },
      {
        contactDetailTypeId: ContactDetailTypeId.EMAIL,
        value: 'mail@test',
      },
    ];
  }
});
