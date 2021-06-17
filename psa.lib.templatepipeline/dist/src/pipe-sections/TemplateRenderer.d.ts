import { PipeSection } from './PipeSection';
import { HtmlDocument } from '../template-documents';
export declare class TemplateRenderer implements PipeSection<HtmlDocument, HtmlDocument> {
    entity: Record<string, unknown> | null;
    constructor(entity: Record<string, unknown> | null);
    execute(input: HtmlDocument): HtmlDocument;
    private renderTemplate;
}
