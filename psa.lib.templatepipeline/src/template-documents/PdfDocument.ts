import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class PdfDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.PDF;
  public readonly pdf: Promise<Buffer>;

  public constructor(pdf: Buffer | Promise<Buffer>) {
    super();
    this.pdf = Promise.resolve(pdf);
  }
}
