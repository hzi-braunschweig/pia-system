/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import stream, { Readable } from 'stream';
import { promisify } from 'util';
import { WriteIntoArrayStream } from '@pia/lib-service-core';
import {
  PersonalDataMapperStream,
  PersonalDataMapperStreamOutput,
} from './personalDataMapperStream';
import { PersonSummary } from '../../models/modys';
import { ContactDetailTypeId } from '../../models/modysApi';

const pipeline = promisify(stream.pipeline);

chai.use(sinonChai);

describe('PersonalDataMapper', () => {
  it('should end the stream without doing anything, if nothing written into the stream', async () => {
    // Arrange
    const personalDataMapperStream = new PersonalDataMapperStream();
    const results: PersonalDataMapperStreamOutput[] = [];
    const modysProbands: Promise<PersonSummary | null>[] = [];

    // Act
    await pipeline(
      Readable.from(modysProbands),
      personalDataMapperStream,
      new WriteIntoArrayStream<PersonalDataMapperStreamOutput>(results)
    );

    // Assert
    expect(personalDataMapperStream.readableEnded).to.be.true;
    expect(personalDataMapperStream.writableEnded).to.be.true;
    expect(results).to.be.empty;
  });

  it('should end the stream without doing anything, if the resolved request on modys resolves null', async () => {
    // Arrange
    const personalDataMapperStream = new PersonalDataMapperStream();
    const results: PersonalDataMapperStreamOutput[] = [];
    const modysProbandsReadable = new Readable({
      objectMode: true,
      read(): void {
        this.push(Promise.resolve(null));
        this.push(null);
      },
    });

    // Act
    await pipeline(
      modysProbandsReadable,
      personalDataMapperStream,
      new WriteIntoArrayStream<PersonalDataMapperStreamOutput>(results)
    );

    // Assert
    expect(personalDataMapperStream.readableEnded).to.be.true;
    expect(personalDataMapperStream.writableEnded).to.be.true;
    expect(results).to.be.empty;
  });

  it('should map the summary of a person with no real data', async () => {
    // Arrange
    const personalDataMapperStream = new PersonalDataMapperStream();
    const results: PersonalDataMapperStreamOutput[] = [];
    const person1: PersonSummary = {
      pseudonym: 'TEST-0001',
      overview: {},
      contactDetails: [
        {
          contactDetailTypeId: ContactDetailTypeId.EMAIL,
        },
      ],
    };
    const modysProbands: Promise<PersonSummary | null>[] = [
      Promise.resolve(person1),
    ];

    // Act
    await pipeline(
      Readable.from(modysProbands),
      personalDataMapperStream,
      new WriteIntoArrayStream<PersonalDataMapperStreamOutput>(results)
    );

    // Assert
    expect(personalDataMapperStream.readableEnded).to.be.true;
    expect(personalDataMapperStream.writableEnded).to.be.true;
    expect(results).to.have.lengthOf(1);
    const expected: PersonalDataMapperStreamOutput = {
      pseudonym: 'TEST-0001',
      personalData: {
        anrede: undefined,
        titel: undefined,
        name: undefined,
        vorname: undefined,
        strasse: undefined,
        haus_nr: undefined,
        plz: undefined,
        landkreis: undefined,
        ort: undefined,
        telefon_privat: undefined,
        telefon_dienst: undefined,
        telefon_mobil: undefined,
        email: undefined,
      },
    };
    expect(results[0]).to.deep.equal(expected);
  });

  it('should map the summary of a person with data', async () => {
    // Arrange
    const personalDataMapperStream = new PersonalDataMapperStream();
    const results: PersonalDataMapperStreamOutput[] = [];
    const person1: PersonSummary = {
      pseudonym: 'TEST-0001',
      overview: {
        salutation: 'Mr.',
        title: 'Prof.',
        firstname: 'Jack',
        name: 'Random',
        streetName: 'Main Street',
        streetNumber: '42',
        postcode: '98765',
        stateFkLang: 'Lk. Braunschweig',
        cityName: 'Buxtehude',
      },
      contactDetails: [
        {
          contactDetailTypeId: ContactDetailTypeId.EMAIL,
          value: 'jack.random@example.com',
        },
        {
          contactDetailTypeId: ContactDetailTypeId.TELEFON_DIENST,
          value: '0123/456789',
        },
        {
          contactDetailTypeId: ContactDetailTypeId.TELEFON_MOBIL,
          value: '+49 123/456788',
        },
        {
          contactDetailTypeId: ContactDetailTypeId.TELEFON_PRIVAT,
          value: '0123 456787',
        },
      ],
    };
    const modysProbands: Promise<PersonSummary | null>[] = [
      Promise.resolve(person1),
    ];

    // Act
    await pipeline(
      Readable.from(modysProbands),
      personalDataMapperStream,
      new WriteIntoArrayStream<PersonalDataMapperStreamOutput>(results)
    );

    // Assert
    expect(personalDataMapperStream.readableEnded).to.be.true;
    expect(personalDataMapperStream.writableEnded).to.be.true;
    expect(results).to.have.lengthOf(1);
    const expected: PersonalDataMapperStreamOutput = {
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
    expect(results[0]).to.deep.equal(expected);
  });
});
