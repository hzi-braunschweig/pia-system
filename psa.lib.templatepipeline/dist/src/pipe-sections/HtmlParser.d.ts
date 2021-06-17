import { PipeSection } from './PipeSection';
import { DomDocument, HtmlDocument } from '../template-documents';
export declare class HtmlParser implements PipeSection<HtmlDocument, DomDocument> {
    execute(input: HtmlDocument): DomDocument;
    private parseHtml;
}
