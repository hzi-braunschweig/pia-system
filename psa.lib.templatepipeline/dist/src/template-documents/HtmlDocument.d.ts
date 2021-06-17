import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class HtmlDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.HTML;
    readonly htmlText: Promise<string>;
    constructor(htmlText: string | Promise<string>);
}
