import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class PdfDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.PDF;
    readonly pdf: Promise<Uint8Array>;
    constructor(pdf: Uint8Array | Promise<Uint8Array>);
}
