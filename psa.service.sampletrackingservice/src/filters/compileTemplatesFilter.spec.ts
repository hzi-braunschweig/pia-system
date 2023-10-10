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
import { compileTemplatesFilter } from './compileTemplatesFilter';

describe('Compile Templates Filter', () => {
  it('should convert template segments of type "HTML_TEMPLATE" to HTML', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = compileTemplatesFilter(templatePipelineDocument);

    expect(result.segments).to.have.lengthOf(2);
    expect(result.segments[0].content).to.include(
      '<h1 id="marked---markdown-parser">Marked - Markdown Parser</h1>\n' +
        '<p>Mustache lets you convert HTML into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.</p>'
    );
    expect(result.segments[0].content).not.to.include(
      '<h2 id="how-to-use-the-demo">How To Use The Demo</h2>'
    );
  });

  it('should not convert segments of other types', () => {
    const templatePipelineDocument = createTemplatePipelineDocument('HTML');
    const result = compileTemplatesFilter(templatePipelineDocument);

    expect(result.segments).to.have.lengthOf(2);
    expect(result.segments[0].content).to.equal(getHtmlTemplate());
    expect(result.segments[1].content).to.equal('do_not_touch');
  });

  function createTemplatePipelineDocument(type = 'HTML_TEMPLATE') {
    return {
      entity: {
        libraryName: 'Mustache',
        language: 'HTML',
        showHowTo: false,
      },
      segments: [
        {
          type: type,
          content: getHtmlTemplate(),
        },
        {
          type: 'UNKNOWN_SEGMENT',
          content: 'do_not_touch',
        },
      ],
    };
  }

  function getHtmlTemplate() {
    return (
      '<h1 id="marked---markdown-parser">Marked - Markdown Parser</h1>\n' +
      '<p>{{ libraryName }} lets you convert {{ language }} into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.</p>\n' +
      '{{#showHowTo}}<h2 id="how-to-use-the-demo">How To Use The Demo</h2>\n' +
      '<ol>\n' +
      '<li>Type in stuff on the left.</li>\n' +
      '<li>See the live updates on the right.</li>\n' +
      '</ol>\n' +
      '<p>That&#39;s it.  Pretty simple.  {{/showHowTo}}There&#39;s also a drop-down option in the upper right to switch between various views:</p>\n' +
      '<ul>\n' +
      '<li><strong>Preview:</strong>  A live display of the generated HTML as it would render in a browser.</li>\n' +
      '<li><strong>HTML Source:</strong>  The generated HTML before your browser makes it pretty.</li>\n' +
      '<li><strong>Lexer Data:</strong>  What [marked] uses internally, in case you like gory stuff like this.</li>\n' +
      '<li><strong>Quick Reference:</strong>  A brief run-down of how to format things using markdown.</li>\n' +
      '</ul>\n'
    );
  }
});
