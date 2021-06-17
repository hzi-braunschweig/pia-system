import { PipeSection } from './PipeSection';
import { HtmlDocument, MarkdownDocument } from '../template-documents';
export declare class MarkdownCompiler implements PipeSection<MarkdownDocument, HtmlDocument> {
    allowedTags: string[];
    constructor(tags: string[]);
    execute(input: MarkdownDocument): HtmlDocument;
    private parseMarkdown;
}
