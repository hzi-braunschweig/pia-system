/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class MarkdownDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.MARKDOWN;
  public readonly markdownText: Promise<string>;

  public constructor(markdownText: string | Promise<string>) {
    super();
    this.markdownText = Promise.resolve(markdownText);
  }
}
