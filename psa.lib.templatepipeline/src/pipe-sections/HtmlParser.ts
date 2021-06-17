import { PipeSection } from './PipeSection';
import { DocumentFragment, parseFragment } from 'parse5';
import { isParentNode } from '../Parse5TypeGuards';
import { DomDocument, HtmlDocument } from '../template-documents';

export class HtmlParser implements PipeSection<HtmlDocument, DomDocument> {
  public execute(input: HtmlDocument): DomDocument {
    return new DomDocument(this.parseHtml(input.htmlText));
  }

  private async parseHtml(
    htmlText: Promise<string>
  ): Promise<DocumentFragment> {
    const parsedHtml = parseFragment(await htmlText);
    if (!isParentNode(parsedHtml)) {
      throw Error('Could not parse the html');
    }
    return parsedHtml;
  }
}
