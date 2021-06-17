import { PipeSection } from './PipeSection';
import { DocumentFragment, Element, Node } from 'parse5';
import { isElement, isParentNode } from '../Parse5TypeGuards';
import { DomDocument } from '../template-documents';

export abstract class CustomTagConverter
  implements PipeSection<DomDocument, DomDocument>
{
  public abstract readonly tagName: string;

  public execute(input: DomDocument): DomDocument {
    return new DomDocument(this.convertAllCustomRadioTags(input.dom));
  }

  private async convertAllCustomRadioTags(
    dom: DocumentFragment | Promise<DocumentFragment>
  ): Promise<DocumentFragment> {
    const document = await dom;
    document.childNodes.forEach((node) => this.convertAllSubNodes(node));
    return document;
  }

  private convertAllSubNodes(node: Node): void {
    if (isParentNode(node)) {
      node.childNodes.forEach((child) => this.convertAllSubNodes(child));
    }
    if (isElement(node) && node.tagName === this.tagName) {
      this.convertNode(node);
    }
  }

  protected abstract convertNode(node: Element): void;
}
