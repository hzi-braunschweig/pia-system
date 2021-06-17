import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class MarkdownDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.MARKDOWN;
  public readonly markdownText: Promise<string>;

  public constructor(markdownText: string | Promise<string>) {
    super();
    this.markdownText = Promise.resolve(markdownText);
  }
}
