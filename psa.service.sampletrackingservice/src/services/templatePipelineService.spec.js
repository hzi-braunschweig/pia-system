const expect = require('chai').expect;
const templatePipelineService = require('../../src/services/templatePipelineService');
const format = require('date-fns/format');

describe('Template Pipeline Service', () => {
  it('should convert an entity and a template into HTML', () => {
    const entity = {
      libraryName: 'Test',
      language: 'Something',
      showTable: true,
      lab_observations: [
        {
          id: 1,
          lab_result_id: 'Test-1234567',
          name_id: 521035,
          name: 'Adenovirus-PCR (resp.)',
          result_string: 'negativ',
          result_value: null,
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
        {
          id: 2,
          lab_result_id: 'Test-1234567',
          name_id: 521036,
          name: 'HMPV-NAT',
          result_string: 'positiv',
          result_value: 33,
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
      ],
    };
    const template = getMarkdownTemplate();
    const result = templatePipelineService.generateLaboratoryResult(
      entity,
      template
    );

    expect(result).to.equal(getExpectedHtml());
  });

  function getMarkdownTemplate() {
    return (
      'Marked - Markdown Parser\n' +
      '========================\n' +
      '\n' +
      '{{ libraryName }} lets you convert {{ language }} into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.\n' +
      '\n' +
      '{{#showTable}}<pia-laboratory-result-table>' +
      '  <pia-laboratory-result-entry name="COVID-19"></pia-laboratory-result-entry>' +
      '  <pia-laboratory-result-entry name="HMPV-NAT"></pia-laboratory-result-entry>' +
      '  <pia-laboratory-result-entry name="Adenovirus-PCR (resp.)"></pia-laboratory-result-entry>' +
      '</pia-laboratory-result-table>{{/showTable}}\n' +
      "That's it.  Pretty simple.  There's also a drop-down option in the upper right to switch between various views:\n" +
      '\n' +
      '- **Preview:**  A live display of the generated HTML as it would render in a browser.\n' +
      '- **HTML Source:**  The generated HTML before your browser makes it pretty.\n' +
      '- **Lexer Data:**  What [marked] uses internally, in case you like gory stuff like this.\n' +
      '- **Quick Reference:**  A brief run-down of how to format things using markdown.'
    );
  }

  const dateFormat = 'dd.MM.yyyy, H:mm';

  function formatDate(isoDate) {
    return format(new Date(isoDate), dateFormat);
  }

  function getExpectedHtml() {
    return (
      '<h1 id="marked---markdown-parser">Marked - Markdown Parser</h1>\n' +
      '<p>Test lets you convert Something into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.</p>\n' +
      '<p><table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th><th>Analysis Datum</th><th>Eingang der Probe</th><th>Datum der Ergebnismitteilung</th></tr><tr><td>HMPV-NAT</td><td>positiv</td><td>' +
      formatDate('2018-05-03T00:00:00.000Z') +
      '</td><td>' +
      formatDate('2018-05-31T18:22:00.000Z') +
      '</td><td>' +
      formatDate('2018-09-06T00:00:00.000Z') +
      '</td></tr><tr><td>Adenovirus-PCR (resp.)</td><td>negativ</td><td>' +
      formatDate('2018-05-03T00:00:00.000Z') +
      '</td><td>' +
      formatDate('2018-05-31T18:22:00.000Z') +
      '</td><td>' +
      formatDate('2018-09-06T00:00:00.000Z') +
      '</td></tr></table>\n' +
      'That&#39;s it.  Pretty simple.  There&#39;s also a drop-down option in the upper right to switch between various views:</p>\n' +
      '<ul>\n' +
      '<li><strong>Preview:</strong>  A live display of the generated HTML as it would render in a browser.</li>\n' +
      '<li><strong>HTML Source:</strong>  The generated HTML before your browser makes it pretty.</li>\n' +
      '<li><strong>Lexer Data:</strong>  What [marked] uses internally, in case you like gory stuff like this.</li>\n' +
      '<li><strong>Quick Reference:</strong>  A brief run-down of how to format things using markdown.</li>\n' +
      '</ul>\n'
    );
  }
});
