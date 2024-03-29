/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface LabResult {
  id: string;
  user_id: string;
  order_id: number;
  dummy_sample_id: string;
  performing_doctor: string;
  date_of_sampling: string;
  remark: string;
  status: string;
  study_status: string;
  new_samples_sent: boolean;
}

export interface BloodSample {
  id: number;
  user_id: string;
  sample_id: string;
  blood_sample_carried_out: boolean;
  remark: string;
}
