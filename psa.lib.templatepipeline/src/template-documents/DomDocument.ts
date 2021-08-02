/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DocumentFragment } from 'parse5';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class DomDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.DOM;
  public readonly dom: Promise<DocumentFragment>;

  public constructor(dom: DocumentFragment | Promise<DocumentFragment>) {
    super();
    this.dom = Promise.resolve(dom);
  }
}
