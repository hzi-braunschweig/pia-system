import { SegmentType } from './TemplateSegment';

export class HtmlSegment {
  public readonly type = SegmentType.HTML;
  public html: string;

  public constructor(html: string) {
    this.html = html;
  }
}
