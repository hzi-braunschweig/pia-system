import { PipeSection } from './PipeSection';
import { DocumentFragment, serialize } from 'parse5';
import { DomDocument, HtmlDocument } from '../template-documents';

export class HtmlSerializer implements PipeSection<DomDocument, HtmlDocument> {
  public execute(input: DomDocument): HtmlDocument {
    return new HtmlDocument(this.serializeHtml(input.dom));
  }

  private async serializeHtml(dom: Promise<DocumentFragment>): Promise<string> {
    return serialize(await dom);
  }
}
