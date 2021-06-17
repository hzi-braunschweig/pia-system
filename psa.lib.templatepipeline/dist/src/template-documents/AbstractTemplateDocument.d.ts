import { TemplateDocument, TemplateSegmentTypes } from './TemplateDocument';
import { PipeSection } from '../pipe-sections/PipeSection';
export declare abstract class AbstractTemplateDocument implements TemplateDocument {
    abstract readonly type: TemplateSegmentTypes;
    pipe<O extends TemplateDocument>(pipeSection: PipeSection<this, O>): O;
}
