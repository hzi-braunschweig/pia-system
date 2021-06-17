import { SegmentType, TemplateSegment } from './TemplateSegment';

export interface Attribute {
  name: string;
  value: string;
}

export class CustomTagSegment {
  public readonly type = SegmentType.CUSTOM_TAG;
  public readonly tagName: string;
  public readonly attrs: Attribute[] = [];
  public readonly children: TemplateSegment[] = [];

  public constructor(
    tagName: string,
    attrs: Attribute[] = [],
    children: TemplateSegment[] = []
  ) {
    this.tagName = tagName;
    this.attrs = attrs;
    this.children = children;
  }
}
