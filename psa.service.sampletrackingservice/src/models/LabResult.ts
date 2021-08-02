/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabObservation } from './LabObservation';

export interface LabResult {
  id: string;
  user_id?: string | null;
  order_id?: number | null;
  dummy_sample_id?: string | null;
  performing_doctor?: string | null;
  date_of_sampling?: string | null;
  remark?: string | null;
  status?: string | null;
  study_status?: string | null;
  new_samples_sent?: boolean;
  lab_observations?: LabObservation[];
}
