/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateDocument, TemplateSegmentTypes } from './TemplateDocument';
import { PipeSection } from '../pipe-sections/PipeSection';

export abstract class AbstractTemplateDocument implements TemplateDocument {
  public abstract readonly type: TemplateSegmentTypes;

  public pipe<O extends TemplateDocument>(
    pipeSection: PipeSection<this, O>
  ): O {
    return pipeSection.execute(this);
  }
}
