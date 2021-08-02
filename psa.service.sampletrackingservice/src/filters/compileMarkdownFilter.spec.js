/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;
const compileMarkdownFilter = require('./compileMarkdownFilter');

describe('Compile Markdown Filter', () => {
  it('should convert template segments of type "MARKDOWN_TEMPLATE" to HTML', () => {
    const templatePipelineDocument = createTemplatePipelineDocument();
    const result = compileMarkdownFilter(templatePipelineDocument);

    expect(result.segments).to.have.lengthOf(1);
    expect(result.segments[0].content).to.include(
      '<h1 id="marked---markdown-parser">Marked - Markdown Parser</h1>\n' +
        '<p>{{ libraryName }} lets you convert {{ language }} into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.</p>'
    );
  });

  it('should not convert segments of other types', () => {
    const templatePipelineDocument = createTemplatePipelineDocument('HTML');
    const result = compileMarkdownFilter(templatePipelineDocument);

    expect(result.segments).to.have.lengthOf(1);
    expect(result.segments[0].content).to.equal(getMarkdownTemplate());
  });

  function createTemplatePipelineDocument(type = 'MARKDOWN_TEMPLATE') {
    return {
      entity: null,
      segments: [
        {
          type: type,
          content: getMarkdownTemplate(),
        },
      ],
    };
  }

  function getMarkdownTemplate() {
    return (
      'Marked - Markdown Parser\n' +
      '========================\n' +
      '\n' +
      '{{ libraryName }} lets you convert {{ language }} into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.\n' +
      '\n' +
      'How To Use The Demo\n' +
      '-------------------\n' +
      '\n' +
      '1. Type in stuff on the left.\n' +
      '2. See the live updates on the right.\n' +
      '\n' +
      "That's it.  Pretty simple.  There's also a drop-down option in the upper right to switch between various views:\n" +
      '\n' +
      '- **Preview:**  A live display of the generated HTML as it would render in a browser.\n' +
      '- **HTML Source:**  The generated HTML before your browser makes it pretty.\n' +
      '- **Lexer Data:**  What [marked] uses internally, in case you like gory stuff like this.\n' +
      '- **Quick Reference:**  A brief run-down of how to format things using markdown.'
    );
  }
});
