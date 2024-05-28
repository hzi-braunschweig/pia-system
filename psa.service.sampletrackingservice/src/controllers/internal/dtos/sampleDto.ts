/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SampleId } from '../../../models/customTypes';

export interface SampleDto {
  dateOfSampling: Date;
  dummyId?: SampleId;
}
