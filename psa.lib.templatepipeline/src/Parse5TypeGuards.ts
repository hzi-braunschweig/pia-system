/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * This module contains type Checks based on parse5's interfaces.
 * The exported functions can be used to check whether a type is of a specific interface.
 * If the interface is matched it is possible to handle the object in typescript like an instance
 * implementing the interface.
 */
import { ChildNode, Element, Node, ParentNode, TextNode } from 'parse5';

/**
 * Internal function to check whether the instance is in general an object which could have attributes.
 * @param instance
 */
function isObject(instance: unknown): instance is Record<string, unknown> {
  return !!instance && typeof instance === 'object';
}

/**
 * Checks whether the instance implements/is compatible with the Node interface
 * @param instance
 */
export function isNode(instance: unknown): instance is Node {
  if (!isObject(instance)) return false;
  const node = instance as unknown as Partial<Node>;
  return typeof node.nodeName === 'string';
}

/**
 * Checks whether the instance implements/is compatible with the ParentNode interface
 * @param instance
 */
export function isParentNode(instance: unknown): instance is ParentNode {
  if (!isNode(instance)) return false;
  const node = instance as unknown as Partial<ParentNode>;
  return typeof node.childNodes === 'object';
}

/**
 * Checks whether the instance implements/is compatible with the ChildNode interface
 * @param instance
 */
export function isChildNode(instance: unknown): instance is ChildNode {
  if (!isNode(instance)) return false;
  const node = instance as unknown as Partial<ChildNode>;
  return typeof node.parentNode === 'object';
}

/**
 * Checks whether the instance implements/is compatible with the Element interface
 * @param instance
 */
export function isElement(instance: unknown): instance is Element {
  if (!isParentNode(instance) || !isChildNode(instance)) return false;
  const node = instance as unknown as Partial<Element>;
  return (
    typeof node.nodeName === 'string' &&
    typeof node.tagName === 'string' &&
    typeof node.namespaceURI === 'string' &&
    typeof node.attrs === 'object'
  );
}

/**
 * Checks whether the instance implements/is compatible with the TextNode interface
 * @param instance
 */
export function isTextNode(instance: unknown): instance is TextNode {
  if (!isChildNode(instance)) return false;
  const node = instance as unknown as Partial<TextNode>;
  return node.nodeName === '#text' && typeof node.value === 'string';
}
