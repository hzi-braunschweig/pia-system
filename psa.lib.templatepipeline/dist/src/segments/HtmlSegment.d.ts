import { SegmentType } from './TemplateSegment';
export declare class HtmlSegment {
    readonly type = SegmentType.HTML;
    html: string;
    constructor(html: string);
}
