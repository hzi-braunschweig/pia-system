import { PipeSection } from './PipeSection';
import { Element } from 'parse5';
import { DomDocument } from '../template-documents';
export declare abstract class CustomTagConverter implements PipeSection<DomDocument, DomDocument> {
    abstract readonly tagName: string;
    execute(input: DomDocument): DomDocument;
    private convertAllCustomRadioTags;
    private convertAllSubNodes;
    protected abstract convertNode(node: Element): void;
}
