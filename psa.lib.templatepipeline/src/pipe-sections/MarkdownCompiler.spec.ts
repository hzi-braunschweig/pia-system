import { expect } from 'chai';

import { MarkdownCompiler } from './MarkdownCompiler';
import { MarkdownDocument } from '../template-documents/MarkdownDocument';

const allowedTags = ['pia-custom-tag'];

describe('MarkdownCompiler', () => {
  it('should parse a heading', async () => {
    const html = await new MarkdownCompiler(allowedTags).execute(
      new MarkdownDocument('# Heading')
    ).htmlText;
    expect(html).to.include('<h1');
    expect(html).to.include('</h1>');
    expect(html).to.include('Heading');
  });
  it('should parse normal text', async () => {
    const html = await new MarkdownCompiler(allowedTags).execute(
      new MarkdownDocument('text')
    ).htmlText;
    expect(html).to.include('<p');
    expect(html).to.include('</p>');
    expect(html).to.include('text');
  });
  it('should parse html as html', async () => {
    const html = await new MarkdownCompiler(allowedTags).execute(
      new MarkdownDocument('<div>text</div>')
    ).htmlText;
    expect(html).to.equal('<div>text</div>');
  });
  it('should parse custom html as html', async () => {
    const html = await new MarkdownCompiler(allowedTags).execute(
      new MarkdownDocument('<pia-custom-tag>\ntext\n</pia-custom-tag>')
    ).htmlText;
    expect(html).to.equal('<pia-custom-tag>\ntext\n</pia-custom-tag>');
  });
  it('should sanitize the parsed html content', async () => {
    const html = await new MarkdownCompiler(allowedTags).execute(
      new MarkdownDocument(
        '<pia-custom-tag>\ntext\n<img src=abc onerror=alert(1)//></pia-custom-tag>'
      )
    ).htmlText;
    expect(html).to.equal(
      '<pia-custom-tag>\ntext\n<img src="abc"></pia-custom-tag>'
    );
  });
});
