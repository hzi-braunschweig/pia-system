/// <reference types="node" />
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class PdfDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.PDF;
    readonly pdf: Promise<Buffer>;
    constructor(pdf: Buffer | Promise<Buffer>);
}
