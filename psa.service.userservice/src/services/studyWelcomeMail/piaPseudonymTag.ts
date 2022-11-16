/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CustomTagConverter } from '@pia/lib-templatepipeline';
import { Element, Node, parseFragment } from 'parse5';

export class PiaPseudonymTag extends CustomTagConverter {
  public readonly tagName = 'pia-pseudonym';

  protected convertNode(node: Node): void {
    const element: Element = node as Element;
    const i: number = element.parentNode.childNodes.findIndex(
      (child) => child === node
    );
    // eslint-disable-next-line security/detect-object-injection -- constant i cannot be an object
    element.parentNode.childNodes[i] =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parseFragment('{{pseudonym}}').childNodes[0]!;
  }
}
