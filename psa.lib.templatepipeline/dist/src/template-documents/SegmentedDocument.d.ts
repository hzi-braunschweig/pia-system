import { TemplateSegment } from '../segments';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class SegmentedDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.SEGMENTED;
    readonly segments: Promise<TemplateSegment[]>;
    constructor(segments: TemplateSegment[] | Promise<TemplateSegment[]>);
}
