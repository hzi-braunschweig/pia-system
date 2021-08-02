/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateDocument } from '../template-documents';

export interface PipeSection<
  I extends TemplateDocument,
  O extends TemplateDocument
> {
  execute(input: I): O;
}
