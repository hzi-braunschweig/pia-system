import { PipeSection } from './PipeSection';
import { Attribute, ChildNode, Element, ParentNode, serialize } from 'parse5';
import {
  isTemplateSegment,
  TemplateSegment,
} from '../segments/TemplateSegment';
import { isElement, isTextNode } from '../Parse5TypeGuards';
import { DomDocument, SegmentedDocument } from '../template-documents';
import { CustomTagSegment, HtmlSegment } from '../segments';

export class DomSegmenter
  implements PipeSection<DomDocument, SegmentedDocument>
{
  public execute(input: DomDocument): SegmentedDocument {
    return new SegmentedDocument(this.segmentDocument(input.dom));
  }

  private async segmentDocument(
    dom: Promise<ParentNode>
  ): Promise<TemplateSegment[]> {
    return this.segmentParentNode(await dom);
  }

  private segmentParentNode(parent: ParentNode): TemplateSegment[] {
    const segments: TemplateSegment[] = [];
    for (const child of parent.childNodes) {
      const newSegmentS = this.convertChildToSegmentS(child);
      if (newSegmentS === null) {
        // continue
      } else if (isTemplateSegment(newSegmentS)) {
        segments.push(newSegmentS);
      } else {
        newSegmentS.forEach((segment) => segments.push(segment));
      }
    }
    return segments;
  }

  private convertChildToSegmentS(
    child: ChildNode
  ): TemplateSegment | TemplateSegment[] | null {
    if (isElement(child) && child.tagName === 'p') {
      // a p-tag on root level must be split into p tags and custom tags
      const sections: (Element | ChildNode[])[] = [];
      let i = 0;
      child.childNodes.forEach((pChild) => {
        if (isElement(pChild) && this.isCustomHtmlTag(pChild.tagName)) {
          if (!(sections.length === 0 && i === 0)) {
            i++;
          }
          sections[i] = pChild;
          i++;
        } else {
          if (!sections[i]) {
            sections[i] = [];
          }
          (sections[i] as ChildNode[]).push(pChild);
        }
      });
      return sections.map((section) => {
        if (Array.isArray(section)) {
          const pCopy: ParentNode = {
            ...child,
          };
          pCopy.childNodes = section.map((node) => ({
            ...node,
            parentNode: pCopy,
          }));
          return this.createHtmlSegment(pCopy);
        } else {
          return this.createCustomTagSegment(section);
        }
      });
    } else if (isElement(child) && this.isCustomHtmlTag(child.tagName)) {
      // a custom tag must be converted to a CutsomTagSegment with optional child segments
      return this.createCustomTagSegment(child);
    } else if (isTextNode(child) && child.value === '\n') {
      // a text tag with only a line break can be ignored
      return null;
    } else {
      // any other default html tag can be converted into a normal HtmlSegment with all child-nodes
      return this.createHtmlSegment(child);
    }
  }

  private createHtmlSegment(child: ChildNode): HtmlSegment {
    return new HtmlSegment(
      serialize({
        nodeName: '#document-fragment',
        childNodes: [child],
      })
    );
  }

  private createCustomTagSegment(child: Element): CustomTagSegment {
    const attrs = child.attrs.map((attr: Attribute) => {
      const attrCopy: Attribute = { name: attr.name, value: attr.value };
      return attrCopy;
    });
    const children = this.segmentParentNode(child);
    return new CustomTagSegment(child.tagName, attrs, children);
  }

  private isCustomHtmlTag(nodeName: string): boolean {
    return (
      !/^[A-Za-z][A-Za-z0-9]*$/.exec(nodeName) &&
      !!/^[A-Za-z]([A-Za-z0-9-]*[A-Za-z0-9])?$/.exec(nodeName)
    );
  }
}
