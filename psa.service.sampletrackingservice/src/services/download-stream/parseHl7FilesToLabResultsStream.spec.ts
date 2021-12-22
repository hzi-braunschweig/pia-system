/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-non-null-assertion */

import { ParseHl7FilesToLabResultsStream } from './parseHl7FilesToLabResultsStream';
import { once } from 'events';
import { PassThrough } from 'stream';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fs from 'fs/promises';
import { ImportFile } from '../../models/ImportFile';
import { LabResult } from '../../models/LabResult';

const sandbox = sinon.createSandbox();
chai.use(sinonChai);

describe('ParseHl7FilesToLabrRsultsStream', () => {
  before(() => {
    sandbox.useFakeTimers();
  });
  after(() => {
    sandbox.restore();
  });

  it('should parse a hl7 file with no error', async () => {
    const stream = new ParseHl7FilesToLabResultsStream();

    const m1 = await fs.readFile('tests/unit/data/M1.hl7', 'utf-8');
    stream.write({
      path: './no/where',
      content: m1,
    });
    stream.end();
    const eventArgs = await once(stream, 'data');
    expect(eventArgs[0].result, eventArgs.toString()).to.deep.equal(
      getExample1()
    );
  });

  it('should finish when everything is converted and end when everything is read.', async () => {
    const source = new PassThrough({ objectMode: true });
    const stream = new ParseHl7FilesToLabResultsStream();

    source.pipe(stream);

    source.write({ content: '' });
    source.write({ content: '' });
    source.write({ content: '' });
    source.end();
    await once(stream, 'finish');

    let count = 0;
    stream.on('data', () => count++);
    await once(stream, 'end');
    expect(count).to.equal(0); // because there is no valid content
  });

  it('should convert multiple given HL7 files to lab result objects', async () => {
    // Arrange
    const m2 = await fs.readFile('tests/unit/data/M2.hl7', 'utf-8');
    const m3 = await fs.readFile('tests/unit/data/M3.hl7', 'utf-8');

    const stream = new ParseHl7FilesToLabResultsStream();

    // Act
    stream.write({ content: m2 });
    stream.write({ content: m3 });
    stream.end();

    // Assert
    const results: ImportFile[] = [];
    stream.on('data', (data: ImportFile) => results.push(data));
    await once(stream, 'end');

    expect(results[0]!.result).to.deep.equal(getExample2());
    expect(results[1]!.result).to.deep.equal(getExample3());
  });

  it('should parse a hl7 file and log an error if observation value is neither pos nor neg', async () => {
    const stream = new ParseHl7FilesToLabResultsStream();

    const m1temp = await fs.readFile('tests/unit/data/M1.hl7', 'utf-8');
    const m1 = m1temp.replace('neg', 'nB');
    stream.write({
      path: './no/where',
      content: m1,
    });
    stream.end();
    const results: ImportFile[] = [];
    stream.on('data', (data: ImportFile) => results.push(data));
    await once(stream, 'end');
    const example1 = getExample1();
    example1.lab_observations![0]!.result_string = 'NA';

    expect(results).to.have.length(1);
    expect(results[0]!.result).to.deep.equal(example1);
  });
});

function getExample1(): LabResult {
  return {
    id: 'ZIFCO-1923456852',
    order_id: 1117136,
    performing_doctor: 'Schmitt',
    lab_observations: [
      {
        name_id: 521035,
        name: 'Adenovirus-PCR (resp.)',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521036,
        name: 'HMPV-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521037,
        name: 'Influenza-A-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521038,
        name: 'Influenza-B-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521039,
        name: 'Parainfluenza-1-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521040,
        name: 'Parainfluenza-2-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521041,
        name: 'Parainfluenza-3-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521042,
        name: 'Parainfluenza-4-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521043,
        name: 'Rhinovirus-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521044,
        name: 'RSV-PCR',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels PCR konnten keine Genome von Adeno-, humanes Metapneumo-, Influenza-A/B, Parainfluenzavirus 1-4, Rhino- oder Respiratory-Syncytial-Virus nachgewiesen werden.',
        date_of_analysis: new Date('2018-10-23T15:54:00'),
        date_of_delivery: new Date('2018-10-23T12:44:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
    ],
  };
}

function getExample2(): LabResult {
  return {
    id: 'TEST-12345679013',
    order_id: 1062743,
    performing_doctor: 'Glowacka',
    lab_observations: [
      {
        name_id: 521035,
        name: 'Adenovirus-PCR (resp.)',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521036,
        name: 'HMPV-NAT',
        result_string: 'positiv',
        result_value: '33',
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521037,
        name: 'Influenzavirus-A-NAT',
        result_string: 'positiv',
        result_value: '21',
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521038,
        name: 'Influenzavirus-B-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521039,
        name: 'Parainfluenzavirus-1-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521040,
        name: 'Parainfluenzavirus-2-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521041,
        name: 'Parainfluenzavirus-3-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521042,
        name: 'Parainfluenzavirus-4-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521043,
        name: 'Rhinovirus-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521044,
        name: 'RSV-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
    ],
  };
}

function getExample3(): LabResult {
  return {
    id: 'TEST-12345679012',
    order_id: 1062743,
    performing_doctor: 'Glowacka',
    lab_observations: [
      {
        name_id: 521035,
        name: 'Adenovirus-PCR (resp.)',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521036,
        name: 'HMPV-NAT',
        result_string: 'positiv',
        result_value: '33',
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521037,
        name: 'Influenzavirus-A-NAT',
        result_string: 'positiv',
        result_value: '21',
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521038,
        name: 'Influenzavirus-B-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521039,
        name: 'Parainfluenzavirus-1-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521040,
        name: 'Parainfluenzavirus-2-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521041,
        name: 'Parainfluenzavirus-3-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521042,
        name: 'Parainfluenzavirus-4-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521043,
        name: 'Rhinovirus-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
      {
        name_id: 521044,
        name: 'RSV-NAT',
        result_string: 'negativ',
        result_value: null,
        comment:
          'Mittels RT-PCR konnte Influenza-A-RNA nachgewiesen werden Mittels PCR konnte HMPV A/B-RNA nachgewiesen werden, allerdings nur sehr schwach positiv. Klinische Relevanz des Befundes in Bezug auf aktuelle Symptomatik ist fraglich, evtl. Restbefund nach durchmachtem respiratorischen Infekt.',
        date_of_analysis: new Date('2018-06-01T09:03:00'),
        date_of_delivery: new Date('2018-05-31T18:22:00'),
        date_of_announcement: new Date(),
        lab_name: 'MHH',
        material: 'Nasenabstrich',
      },
    ],
  };
}
