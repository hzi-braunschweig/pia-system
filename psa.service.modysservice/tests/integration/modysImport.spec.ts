/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import { sandbox as fetchMockSandbox } from 'fetch-mock';
import * as fetch from 'node-fetch';

import { ModysImportService } from '../../src/services/modysImportService';
import { StatusCodes } from 'http-status-codes';
import {
  ContactDetailTypeId,
  VPersonContactDetailOverview,
  VPersonOverview,
} from '../../src/models/modysApi';

const expect = chai.expect;
chai.use(sinonChai);
const fetchMock = fetchMockSandbox();
const sandbox: SinonSandbox = createSandbox();

describe('MODYS Import', () => {
  let fetchStub: SinonStub;

  beforeEach(() => {
    fetchStub = sandbox
      .stub<typeof fetch, 'default'>(fetch, 'default')
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
    mockGetPseudonyms([]);

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchStub.callCount).to.eq(1);
  });

  it('should request MODYS probands for given pseudonyms', async () => {
    // Arrange
    mockGetPseudonyms(['Testproband1', 'Testproband2', 'Testproband3']);
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
      'http://externalmodys/api/pidByIdandType/Testproband1/1',
      {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://externalmodys/api/probands/MODYS_Proband',
      {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
    expect(fetchStub).to.have.been.calledWithExactly(
      'http://externalmodys/api/probandContactDetails/MODYS_Proband',
      {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk',
        },
      }
    );
  });

  it('should finish import if no probands were found in MODYS', async () => {
    // Arrange
    mockGetPseudonyms(['Testproband1', 'Testproband2', 'Testproband3']);
    fetchMock.get('glob:http://externalmodys/api/pidByIdandType/*/1', {
      status: StatusCodes.NOT_FOUND,
    });
    const expectedCallCount = 4;

    // Act
    await ModysImportService.startImport();

    // Assert
    expect(fetchStub.callCount).to.eq(expectedCallCount);
  });

  it('should update mapped probands in personaldataservice', async () => {
    // Arrange
    mockGetPseudonyms(['Testproband1', 'Testproband2', 'Testproband3']);
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
      'http://personaldataservice:5000/personal/personalData/proband/Testproband1',
      {
        method: 'put',
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
    mockGetPseudonyms(['Testproband1', 'Testproband2', 'Testproband3']);
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
    expect(fetchStub.callCount).to.eq(expectedCallCount);
  });

  function mockGetPseudonyms(body: string[]): void {
    fetchMock.get(
      'http://userservice:5000/user/pseudonyms?study=Teststudy&accountStatus=active&accountStatus=deactivation_pending',
      { status: StatusCodes.OK, body }
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
