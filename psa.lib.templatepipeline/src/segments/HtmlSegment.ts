/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SegmentType } from './TemplateSegment';

export class HtmlSegment {
  public readonly type = SegmentType.HTML;
  public html: string;

  public constructor(html: string) {
    this.html = html;
  }
}
