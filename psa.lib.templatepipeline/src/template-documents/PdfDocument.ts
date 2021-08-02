/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class PdfDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.PDF;
  public readonly pdf: Promise<Buffer>;

  public constructor(pdf: Buffer | Promise<Buffer>) {
    super();
    this.pdf = Promise.resolve(pdf);
  }
}
