/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class HtmlDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.HTML;
  public readonly htmlText: Promise<string>;

  public constructor(htmlText: string | Promise<string>) {
    super();
    this.htmlText = Promise.resolve(htmlText);
  }
}
