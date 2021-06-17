import { PipeSection } from '../pipe-sections/PipeSection';
export declare enum TemplateSegmentTypes {
    MARKDOWN = "MARKDOWN",
    HTML = "HTML",
    DOM = "DOM",
    PDF = "PDF",
    SEGMENTED = "SEGMENTED"
}
export interface TemplateDocument {
    readonly type: TemplateSegmentTypes;
    pipe<O extends TemplateDocument>(pipeSection: PipeSection<this, O>): O;
}
