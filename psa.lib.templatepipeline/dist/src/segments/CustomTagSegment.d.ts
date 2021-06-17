import { SegmentType, TemplateSegment } from './TemplateSegment';
export interface Attribute {
    name: string;
    value: string;
}
export declare class CustomTagSegment {
    readonly type = SegmentType.CUSTOM_TAG;
    readonly tagName: string;
    readonly attrs: Attribute[];
    readonly children: TemplateSegment[];
    constructor(tagName: string, attrs?: Attribute[], children?: TemplateSegment[]);
}
