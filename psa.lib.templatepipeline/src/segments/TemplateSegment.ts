import { CustomTagSegment } from './CustomTagSegment';
import { HtmlSegment } from './HtmlSegment';

export enum SegmentType {
  HTML = 'HTML',
  CUSTOM_TAG = 'CUSTOM_TAG',
}

export type TemplateSegment = HtmlSegment | CustomTagSegment;

function isObject(instance: unknown): instance is Record<string, unknown> {
  return !!instance && typeof instance === 'object';
}

export function isTemplateSegment(
  instance: unknown
): instance is TemplateSegment {
  if (!isObject(instance)) return false;
  const segment = instance as unknown as Partial<TemplateSegment>;
  return (
    segment.type === SegmentType.HTML || segment.type === SegmentType.CUSTOM_TAG
  );
}
