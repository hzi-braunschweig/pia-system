const {
  ParseHl7FilesToLabResultsStream,
} = require('./parseHl7FilesToLabResultsStream');
const { once } = require('events');
const { PassThrough } = require('stream');
const { expect } = require('chai');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const fs = require('fs');

describe('ParseHl7FilesToLabrRsultsStream', () => {
  before(() => {
    sandbox.useFakeTimers();
  });
  after(() => {
    sandbox.restore();
  });

  it('should parse a hl7 file with no error', async () => {
    const stream = new ParseHl7FilesToLabResultsStream();

    const m1 = fs.readFileSync('tests/unit/data/M1.hl7', 'utf-8');
    stream.write({
      path: './no/where',
      content: m1,
    });
    stream.end();
    const eventArgs = await once(stream, 'data');
    expect(eventArgs[0].result, eventArgs).to.deep.equal(getExample1());
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
    const m2 = fs.readFileSync('tests/unit/data/M2.hl7', 'utf-8');
    const m3 = fs.readFileSync('tests/unit/data/M3.hl7', 'utf-8');

    const stream = new ParseHl7FilesToLabResultsStream();

    // Act
    stream.write({ content: m2 });
    stream.write({ content: m3 });
    stream.end();

    // Assert
    const results = [];
    stream.on('data', (data) => results.push(data));
    await once(stream, 'end');

    expect(results[0].result).to.deep.equal(getExample2());
    expect(results[1].result).to.deep.equal(getExample3());
  });
});

function getExample1() {
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

function getExample2() {
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

function getExample3() {
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
