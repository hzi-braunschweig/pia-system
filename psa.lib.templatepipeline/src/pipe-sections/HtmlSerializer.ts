/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipeSection } from './PipeSection';
import { DocumentFragment, serialize } from 'parse5';
import { DomDocument, HtmlDocument } from '../template-documents';

export class HtmlSerializer implements PipeSection<DomDocument, HtmlDocument> {
  public execute(input: DomDocument): HtmlDocument {
    return new HtmlDocument(this.serializeHtml(input.dom));
  }

  private async serializeHtml(dom: Promise<DocumentFragment>): Promise<string> {
    return serialize(await dom);
  }
}
