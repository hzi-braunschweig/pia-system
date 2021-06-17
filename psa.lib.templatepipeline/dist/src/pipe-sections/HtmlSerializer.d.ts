import { PipeSection } from './PipeSection';
import { DomDocument, HtmlDocument } from '../template-documents';
export declare class HtmlSerializer implements PipeSection<DomDocument, HtmlDocument> {
    execute(input: DomDocument): HtmlDocument;
    private serializeHtml;
}
