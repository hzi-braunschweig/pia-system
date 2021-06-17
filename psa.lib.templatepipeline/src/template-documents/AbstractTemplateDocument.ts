import { TemplateDocument, TemplateSegmentTypes } from './TemplateDocument';
import { PipeSection } from '../pipe-sections/PipeSection';

export abstract class AbstractTemplateDocument implements TemplateDocument {
  abstract readonly type: TemplateSegmentTypes;

  public pipe<O extends TemplateDocument>(
    pipeSection: PipeSection<this, O>
  ): O {
    return pipeSection.execute(this);
  }
}
