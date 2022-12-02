/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import {
  CustomTagConverter,
  DomSegmenter,
  HtmlParser,
  HtmlSerializer,
  MarkdownCompiler,
  MarkdownDocument,
  PdfGenerator,
  TemplateRenderer,
} from '../src';

import { Element, Node, ParentNode, parseFragment } from 'parse5';

const allowedTags = [
  'pia-my-custom-tag',
  'pia-consent-input-radio-app',
  'pia-consent-input-radio-labresults',
  'pia-consent-input-radio-generic',
];

class PiaMyCustomTag extends CustomTagConverter {
  public readonly tagName = 'pia-my-custom-tag';

  protected convertNode(node: Node): void {
    const element: Element = node as Element;
    const i = element.parentNode.childNodes.findIndex(
      (child) => child === node
    );
    element.parentNode.childNodes[i] = (
      parseFragment('<p>{{hello}}</p>') as ParentNode
    ).childNodes[0] as Element;
  }
}

describe('Example Pipelines', () => {
  after(async () => {
    await PdfGenerator.closeBrowser();
    // close twice to have that case also covered
    await PdfGenerator.closeBrowser();
  });

  const generatePdfTestTimeout = 10000;
  it('should create a pdf', async () => {
    const pdf = await new MarkdownDocument(
      '# Hello\n<pia-my-custom-tag></pia-my-custom-tag>\nHallo _italic_ World'
    )
      .pipe(new MarkdownCompiler(allowedTags))
      .pipe(new HtmlParser())
      .pipe(new PiaMyCustomTag())
      .pipe(new HtmlSerializer())
      .pipe(new TemplateRenderer({ hello: 'Hello World' }))
      .pipe(new PdfGenerator({ path: './tests/reports/meine.pdf' })).pdf;
    expect(pdf).to.be.an.instanceOf(Buffer);
  }).timeout(generatePdfTestTimeout);

  it('should create a HTMLDocument', async () => {
    const htmlText = await new MarkdownDocument(
      '# Hello\n<pia-my-custom-tag></pia-my-custom-tag>\nHallo _italic_ World'
    )
      .pipe(new MarkdownCompiler(allowedTags))
      .pipe(new HtmlParser())
      .pipe(new PiaMyCustomTag())
      .pipe(new HtmlSerializer())
      .pipe(new TemplateRenderer({ hello: 'Hello World' })).htmlText;
    expect(htmlText).to.equal(
      `<h1 id="hello">Hello</h1>
<p><p>Hello World</p>
Hallo <em>italic</em> World</p>
`
    );
  });

  it('should segment a simple example', async () => {
    const NUMBER_OF_SEGMENTS = 3;
    const segments = await new MarkdownDocument(
      '# Hello\n' +
        '<pia-my-custom-tag my-attr="hello">\n</pia-my-custom-tag>\n' +
        'Hallo'
    )
      .pipe(new MarkdownCompiler(allowedTags))
      .pipe(new HtmlParser())
      .pipe(new DomSegmenter()).segments;
    expect(segments).to.be.an.instanceOf(Array);
    console.log(segments);
    expect(segments.length).to.equal(NUMBER_OF_SEGMENTS);
  });

  it('should segment compliance text', async () => {
    const NUMBER_OF_SEGMENTS = 8;
    const segments = await new MarkdownDocument(
      '# Einwilligung\n' +
        '\n' +
        'App\n' +
        '<pia-consent-input-radio-app></pia-consent-input-radio-app>\n' +
        'Proben\n' +
        '<pia-consent-input-radio-labresults></pia-consent-input-radio-labresults>\n' +
        '\n' +
        '\n' +
        '\n' +
        'Ein beliebiger _italic_ text.\n' +
        '\n' +
        'Mein Lieblingsfeld\n' +
        '<pia-consent-input-radio-generic name="lieblingsfeld"></pia-consent-input-radio-generic>'
    )
      .pipe(new MarkdownCompiler(allowedTags))
      .pipe(new HtmlParser())
      .pipe(new DomSegmenter()).segments;
    expect(segments).to.be.an.instanceOf(Array);
    expect(segments.length).to.equal(NUMBER_OF_SEGMENTS);
  });
});
