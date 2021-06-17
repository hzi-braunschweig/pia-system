import { DocumentFragment } from 'parse5';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';
export declare class DomDocument extends AbstractTemplateDocument {
    readonly type = TemplateSegmentTypes.DOM;
    readonly dom: Promise<DocumentFragment>;
    constructor(dom: DocumentFragment | Promise<DocumentFragment>);
}
