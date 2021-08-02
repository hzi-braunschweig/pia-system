/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import stream, { Readable } from 'stream';
import { promisify } from 'util';
import { PersonalDataUpdateStream } from './personalDataUpdateStream';
import { PersonaldataserviceClient } from '../../clients/personaldataserviceClient';
import Boom from '@hapi/boom';
import { PersonalDataMapperStreamOutput } from './personalDataMapperStream';

const pipeline = promisify(stream.pipeline);

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = createSandbox();

describe('PersonalDataService', () => {
  let personaldataserviceClientStubbed: SinonStubbedInstance<
    typeof PersonaldataserviceClient
  >;

  beforeEach(() => {
    personaldataserviceClientStubbed = {
      updatePersonalData: sandbox.stub(
        PersonaldataserviceClient,
        'updatePersonalData'
      ),
      prototype: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should end the stream without doing anything, if nothing written into the stream', async () => {
    // Arrange
    const personalDataUpdateStream = new PersonalDataUpdateStream();
    const modysProbands: PersonalDataMapperStreamOutput[] = [];

    // Act
    await pipeline(Readable.from(modysProbands), personalDataUpdateStream);

    // Assert
    expect(personalDataUpdateStream.writableEnded).to.be.true;
    expect(personaldataserviceClientStubbed.updatePersonalData).to.have.not.been
      .called;
  });

  it('should send the data of a proband to the personaldataservice', async () => {
    // Arrange
    const personalDataUpdateStream = new PersonalDataUpdateStream();
    const person1: PersonalDataMapperStreamOutput = {
      pseudonym: 'TEST-0001',
      personalData: {
        anrede: 'Mr.',
        titel: 'Prof.',
        vorname: 'Jack',
        name: 'Random',
        strasse: 'Main Street',
        haus_nr: '42',
        plz: '98765',
        ort: 'Buxtehude',
        landkreis: 'Lk. Braunschweig',
        email: 'jack.random@example.com',
        telefon_dienst: '0123/456789',
        telefon_mobil: '+49 123/456788',
        telefon_privat: '0123 456787',
      },
    };
    const modysProbands: PersonalDataMapperStreamOutput[] = [person1];

    // Act
    await pipeline(Readable.from(modysProbands), personalDataUpdateStream);

    // Assert
    expect(personalDataUpdateStream.writableEnded).to.be.true;
    expect(
      personaldataserviceClientStubbed.updatePersonalData
    ).to.have.been.calledOnceWith('TEST-0001', person1.personalData);
  });

  it('should send the data of some probands to the personaldataservice and handle errors', async () => {
    // Arrange
    const personalDataUpdateStream = new PersonalDataUpdateStream();
    const person1: PersonalDataMapperStreamOutput = {
      pseudonym: 'TEST-0001',
      personalData: {
        vorname: 'Jack',
        name: 'Random',
      },
    };
    const person2: PersonalDataMapperStreamOutput = {
      pseudonym: 'TEST-0002',
      personalData: {
        vorname: 'John',
        name: 'Doe',
      },
    };
    const person3: PersonalDataMapperStreamOutput = {
      pseudonym: 'TEST-0003',
      personalData: {
        vorname: 'Jane',
        name: 'Average',
      },
    };
    const modysProbands: PersonalDataMapperStreamOutput[] = [
      person1,
      person2,
      person3,
    ];

    personaldataserviceClientStubbed.updatePersonalData
      .withArgs('TEST-0001', person1.personalData)
      .rejects(Boom.internal('HTTP 500 Error'));
    personaldataserviceClientStubbed.updatePersonalData
      .withArgs('TEST-0002', person2.personalData)
      .resolves();
    personaldataserviceClientStubbed.updatePersonalData
      .withArgs('TEST-0003', person3.personalData)
      .rejects(Boom.notFound('HTTP 404 Error'));

    // Act
    await pipeline(Readable.from(modysProbands), personalDataUpdateStream);

    // Assert
    expect(personalDataUpdateStream.writableEnded).to.be.true;
    expect(personaldataserviceClientStubbed.updatePersonalData).to.have.been
      .calledThrice;
  });
});
