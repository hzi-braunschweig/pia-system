/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-magic-numbers */

const expect = require('chai').expect;
import { parsePlaceholdersFilter } from './parsePlaceholdersFilter';

describe('Parse Placeholders Filter', () => {
  it('should convert template segments of type "MARKDOWN_TEMPLATE" to HTML', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = parsePlaceholdersFilter(templatePipelineDocument);

    expect(result.segments).to.have.lengthOf(5);
    expect(result.segments).to.deep.equal([
      {
        type: 'HTML_TEMPLATE',
        content:
          '<h1>Laboratory Results</h1>\n<p>This are the results:</p>\n{{#showTable}}',
      },
      {
        type: 'PLACEHOLDER',
        content: '',
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
              attributes: [{ key: 'name', value: 'Influenza' }],
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
        content: '',
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
    ]);
  });

  it('should not convert segments of other types', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = parsePlaceholdersFilter(templatePipelineDocument);

    expect(result.segments[4].content).to.equal('do_not_touch');
  });

  function createTemplatePipelineDocument() {
    return {
      entity: null,
      segments: [
        {
          type: 'HTML_TEMPLATE',
          content: getHtmlTemplate(),
        },
        {
          type: 'SOMETHING_ELSE',
          content: 'do_not_touch',
        },
      ],
    };
  }

  function getHtmlTemplate() {
    return (
      '<h1>Laboratory Results</h1>\n' +
      '<p>This are the results:</p>\n' +
      '{{#showTable}}<pia-laboratory-result-table>' +
      '  <pia-laboratory-result-table-entry name="COVID-19"></pia-laboratory-result-table-entry>' +
      '  <pia-laboratory-result-table-entry name="Influenza"></pia-laboratory-result-table-entry>' +
      '  <pia-laboratory-result-table-entry name="Prokrastinenza"></pia-laboratory-result-table-entry>' +
      '</pia-laboratory-result-table>{{/showTable}}\n' +
      '<pia-another-placeholder size="large"></pia-another-placeholder>'
    );
  }
});
