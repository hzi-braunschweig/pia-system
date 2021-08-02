/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { expect } = require('chai');
const { once } = require('events');
const fs = require('fs');

const {
  ParseCsvFilesToLabResultsStream,
} = require('./parseCsvFilesToLabResultsStream');

describe('CSV Laboratory Result Parser', () => {
  it('should convert given csv to a list of labresult objects and persist it', async () => {
    // Arrange
    const file = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_semicolon-separated.csv',
    };
    file.content = fs.readFileSync(file.path, 'utf-8');
    const stream = new ParseCsvFilesToLabResultsStream();
    const results = [];

    // Act
    stream.write(file);
    stream.end();
    stream.on('data', (data) => results.push(data.result));
    await once(stream, 'end');

    // Assert
    expect(results).to.deep.equal(getLabResults());
  });

  it('should support a comma as delimiter', async () => {
    // Arrange
    const file = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_comma-separated.csv',
    };
    file.content = fs.readFileSync(file.path, 'utf-8');
    const stream = new ParseCsvFilesToLabResultsStream();
    const results = [];

    // Act
    stream.write(file);
    stream.end();
    stream.on('data', (data) => results.push(data.result));
    await once(stream, 'end');

    // Assert
    expect(results).to.deep.equal(getLabResults());
  });

  it('should support a colon as delimiter', async () => {
    // Arrange
    const file = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_colon-separated.csv',
    };
    file.content = fs.readFileSync(file.path, 'utf-8');
    const stream = new ParseCsvFilesToLabResultsStream();
    const results = [];

    // Act
    stream.write(file);
    stream.end();
    stream.on('data', (data) => results.push(data.result));
    await once(stream, 'end');

    // Assert
    expect(results).to.deep.equal(getLabResults());
  });

  it('should support a pipe symbol as delimiter', async () => {
    // Arrange
    const file = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_semicolon-separated.csv',
    };
    file.content = fs.readFileSync(file.path, 'utf-8');
    const stream = new ParseCsvFilesToLabResultsStream();
    const results = [];

    // Act
    stream.write(file);
    stream.end();
    stream.on('data', (data) => results.push(data.result));
    await once(stream, 'end');

    // Assert
    expect(results).to.deep.equal(getLabResults());
  });

  it('should handle multiple files', async () => {
    // Arrange
    const file1 = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_semicolon-separated.csv',
    };
    file1.content = fs.readFileSync(file1.path, 'utf-8');
    const file2 = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_comma-separated.csv',
    };
    file2.content = fs.readFileSync(file2.path, 'utf-8');
    const file3 = {
      path: 'tests/unit/data/Laborergebnis_Bsp_200617_pipe-separated.csv',
    };
    file3.content = fs.readFileSync(file3.path, 'utf-8');
    const stream = new ParseCsvFilesToLabResultsStream();
    const results = [];

    // Act
    stream.write(file1);
    stream.write(file2);
    stream.write(file3);
    stream.end();
    stream.on('data', (data) => results.push(data.result));
    await once(stream, 'end');

    // Assert
    expect(results).to.deep.equal([
      ...getLabResults(),
      ...getLabResults(),
      ...getLabResults(),
    ]);
  });

  function getLabResults() {
    return [
      {
        id: 'X-1283855',
        order_id: null,
        status: null,
        performing_doctor: null,
        lab_observations: [
          {
            lab_result_id: 'X-1283855',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-2',
            result_value: '0,7',
            comment: '.',
            date_of_analysis: new Date('2020-06-21T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-22T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'negative',
            unit: '.',
            other_unit: 'ratio',
            kit_name: 'Euroimmun Anti-SARS-CoV-2-ELISA (IgG)',
          },
          {
            lab_result_id: 'X-1283855',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-3',
            result_value: '1,0',
            comment: 'Volumen grenzwertig',
            date_of_analysis: new Date('2020-06-21T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-22T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'grenzwertig',
            unit: '.',
            other_unit: 'ratio',
            kit_name: 'Euroimmun Anti-SARS-CoV-2-ELISA (IgG)',
          },
          {
            lab_result_id: 'X-1283855',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-4',
            result_value: '1,2',
            comment: '.',
            date_of_analysis: new Date('2020-06-21T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-22T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'positive',
            unit: '.',
            other_unit: 'ratio',
            kit_name: 'Euroimmun Anti-SARS-CoV-2-ELISA (IgG)',
          },
          {
            lab_result_id: 'X-1283855',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-5',
            result_value: '11,99',
            comment: 'nicht an den Probanden, nicht befundet',
            date_of_analysis: new Date('2020-06-21T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-22T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'negative',
            unit: 'AU/ml',
            other_unit: '.',
            kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          },
        ],
      },
      {
        id: 'X-1283858',
        order_id: null,
        status: null,
        performing_doctor: null,
        lab_observations: [
          {
            lab_result_id: 'X-1283858',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-6',
            result_value: '12,00',
            comment: 'nicht an den Probanden, nicht befundet',
            date_of_analysis: new Date('2020-06-23T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-24T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'grenzwertig',
            unit: 'AU/ml',
            other_unit: '.',
            kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          },
          {
            lab_result_id: 'X-1283858',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-7',
            result_value: '15,00',
            comment: 'nicht an den Probanden, nicht befundet',
            date_of_analysis: new Date('2020-06-23T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-24T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'grenzwertig',
            unit: 'AU/ml',
            other_unit: '.',
            kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          },
          {
            lab_result_id: 'X-1283858',
            name_id: 0,
            name: 'Antikörper (IgG) gegen SARS-CoV-8',
            result_value: '15,01',
            comment: 'nicht an den Probanden, nicht befundet',
            date_of_analysis: new Date('2020-06-23T00:00:00'),
            date_of_delivery: new Date('2020-06-20T00:00:00'),
            date_of_announcement: new Date('2020-06-24T00:00:00'),
            lab_name: 'Plauen',
            material: 'Vollblut',
            result_string: 'positive',
            unit: 'AU/ml',
            other_unit: '.',
            kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          },
        ],
      },
    ];
  }
});
