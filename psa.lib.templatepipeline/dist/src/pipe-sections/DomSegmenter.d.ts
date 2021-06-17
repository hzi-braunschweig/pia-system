import { PipeSection } from './PipeSection';
import { DomDocument, SegmentedDocument } from '../template-documents';
export declare class DomSegmenter implements PipeSection<DomDocument, SegmentedDocument> {
    execute(input: DomDocument): SegmentedDocument;
    private segmentDocument;
    private segmentParentNode;
    private convertChildToSegmentS;
    private createHtmlSegment;
    private createCustomTagSegment;
    private isCustomHtmlTag;
}
