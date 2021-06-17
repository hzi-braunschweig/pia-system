import { ChildNode, Element, Node, ParentNode, TextNode } from 'parse5';
export declare function isNode(instance: unknown): instance is Node;
export declare function isParentNode(instance: unknown): instance is ParentNode;
export declare function isChildNode(instance: unknown): instance is ChildNode;
export declare function isElement(instance: unknown): instance is Element;
export declare function isTextNode(instance: unknown): instance is TextNode;
