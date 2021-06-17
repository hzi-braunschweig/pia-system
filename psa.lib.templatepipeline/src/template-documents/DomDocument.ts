import { DocumentFragment } from 'parse5';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class DomDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.DOM;
  public readonly dom: Promise<DocumentFragment>;

  public constructor(dom: DocumentFragment | Promise<DocumentFragment>) {
    super();
    this.dom = Promise.resolve(dom);
  }
}
