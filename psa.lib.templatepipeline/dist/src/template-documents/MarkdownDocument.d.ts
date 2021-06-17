import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class MarkdownDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.MARKDOWN;
    readonly markdownText: Promise<string>;
    constructor(markdownText: string | Promise<string>);
}
