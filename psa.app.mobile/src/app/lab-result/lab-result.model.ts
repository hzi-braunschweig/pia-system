/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface SampleAnswer {
  date_of_sampling: Date;
  dummy_sample_id?: string;
}

export interface LabResult {
  id: string;
  user_id: string;
  date_of_sampling: string;
  status: string;
  remark: string;
  new_samples_sent: boolean;
  performing_doctor: string;
  dummy_sample_id: string;
}
