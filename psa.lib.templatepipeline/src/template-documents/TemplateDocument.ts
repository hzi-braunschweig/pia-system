/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipeSection } from '../pipe-sections/PipeSection';

export enum TemplateSegmentTypes {
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  DOM = 'DOM',
  PDF = 'PDF',
  SEGMENTED = 'SEGMENTED',
}

export interface TemplateDocument {
  readonly type: TemplateSegmentTypes;

  pipe<O extends TemplateDocument>(pipeSection: PipeSection<this, O>): O;
}
