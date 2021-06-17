import { TemplateDocument } from '../template-documents';

export interface PipeSection<
  I extends TemplateDocument,
  O extends TemplateDocument
> {
  execute(input: I): O;
}
