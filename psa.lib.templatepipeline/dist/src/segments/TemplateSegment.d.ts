import { CustomTagSegment } from './CustomTagSegment';
import { HtmlSegment } from './HtmlSegment';
export declare enum SegmentType {
    HTML = "HTML",
    CUSTOM_TAG = "CUSTOM_TAG"
}
export declare type TemplateSegment = HtmlSegment | CustomTagSegment;
export declare function isTemplateSegment(instance: unknown): instance is TemplateSegment;
