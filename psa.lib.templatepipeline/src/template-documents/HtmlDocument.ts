import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class HtmlDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.HTML;
  public readonly htmlText: Promise<string>;

  public constructor(htmlText: string | Promise<string>) {
    super();
    this.htmlText = Promise.resolve(htmlText);
  }
}
