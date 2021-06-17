import { TemplateSegment } from '../segments';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class SegmentedDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.SEGMENTED;
  public readonly segments: Promise<TemplateSegment[]>;

  public constructor(segments: TemplateSegment[] | Promise<TemplateSegment[]>) {
    super();
    this.segments = Promise.resolve(segments);
  }
}
