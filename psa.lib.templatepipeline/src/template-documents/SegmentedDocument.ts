/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegment } from '../segments';
import { TemplateSegmentTypes } from './TemplateDocument';
import { AbstractTemplateDocument } from './AbstractTemplateDocument';

export class SegmentedDocument extends AbstractTemplateDocument {
  public readonly type = TemplateSegmentTypes.SEGMENTED;
  public readonly segments: Promise<TemplateSegment[]>;

  public constructor(segments: TemplateSegment[] | Promise<TemplateSegment[]>) {
    super();
    this.segments = Promise.resolve(segments);
  }
}
