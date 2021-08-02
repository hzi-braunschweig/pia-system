/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;
const generateTemplatesFilter = require('./generateTemplatesFilter');

describe('Generate Templates Filter', () => {
  it('should convert pia-laboratory-result-table placeholder into a HTML template', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = generateTemplatesFilter(templatePipelineDocument);

    expect(result.segments[1]).to.deep.equal({
      type: 'HTML_TEMPLATE',
      content:
        '<table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th><th>Analysis Datum</th><th>Eingang der Probe</th><th>Datum der Ergebnismitteilung</th></tr>' +
        '{{#lab_observations.fc3c2327825122295ca0f27af5d5c8e6}}<tr><td>COVID-19</td><td>{{lab_observations.fc3c2327825122295ca0f27af5d5c8e6.result}}</td><td>{{lab_observations.fc3c2327825122295ca0f27af5d5c8e6.date_of_analysis}}</td><td>{{lab_observations.fc3c2327825122295ca0f27af5d5c8e6.date_of_delivery}}</td><td>{{lab_observations.fc3c2327825122295ca0f27af5d5c8e6.date_of_announcement}}</td></tr>{{/lab_observations.fc3c2327825122295ca0f27af5d5c8e6}}' +
        '{{#lab_observations.f678e3e6505f2d5b38b8d912586281bb}}<tr><td>Adenovirus-PCR (resp.)</td><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.result}}</td><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.date_of_analysis}}</td><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.date_of_delivery}}</td><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.date_of_announcement}}</td></tr>{{/lab_observations.f678e3e6505f2d5b38b8d912586281bb}}' +
        '{{#lab_observations.6f0a3b424a33861d4f072c31a6f2cdee}}<tr><td>Prokrastinenza</td><td>{{lab_observations.6f0a3b424a33861d4f072c31a6f2cdee.result}}</td><td>{{lab_observations.6f0a3b424a33861d4f072c31a6f2cdee.date_of_analysis}}</td><td>{{lab_observations.6f0a3b424a33861d4f072c31a6f2cdee.date_of_delivery}}</td><td>{{lab_observations.6f0a3b424a33861d4f072c31a6f2cdee.date_of_announcement}}</td></tr>{{/lab_observations.6f0a3b424a33861d4f072c31a6f2cdee}}' +
        '</table>',
    });
  });

  it('should pass unsupported placeholder segments without changes', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = generateTemplatesFilter(templatePipelineDocument);

    expect(result.segments[3]).to.deep.equal({
      type: 'PLACEHOLDER',
      element: {
        name: 'pia-another-placeholder',
        attributes: [{ key: 'size', value: 'large' }],
        children: [],
      },
    });
  });

  function createTemplatePipelineDocument() {
    return {
      entity: null,
      segments: [
        {
          type: 'HTML_TEMPLATE',
          content:
            '<h1>Laboratory Results</h1>\n<p>This are the results:</p>\n{{#showTable}}',
        },
        {
          type: 'PLACEHOLDER',
          element: {
            name: 'pia-laboratory-result-table',
            attributes: [],
            children: [
              {
                name: 'pia-laboratory-result-table-entry',
                attributes: [{ key: 'name', value: 'COVID-19' }],
                children: [],
              },
              {
                name: 'pia-laboratory-result-table-entry',
                attributes: [{ key: 'name', value: 'Adenovirus-PCR (resp.)' }],
                children: [],
              },
              {
                name: 'pia-laboratory-result-table-entry',
                attributes: [{ key: 'name', value: 'Prokrastinenza' }],
                children: [],
              },
            ],
          },
        },
        {
          type: 'HTML_TEMPLATE',
          content: '{{/showTable}}\n',
        },
        {
          type: 'PLACEHOLDER',
          element: {
            name: 'pia-another-placeholder',
            attributes: [{ key: 'size', value: 'large' }],
            children: [],
          },
        },
        {
          type: 'SOMETHING_ELSE',
          content: 'do_not_touch',
        },
      ],
    };
  }
});
