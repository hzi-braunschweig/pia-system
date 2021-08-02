/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface LabResultObservation {
  lab_result_id: string;
  user_id: string;
  date_of_sampling: Date;
  date_of_delivery: Date;
  date_of_analysis: Date;
  date_of_announcement: Date;
  name: string;
  name_id: string;
  result_string: string;
  result_value: string;
  order_id: string;
  performing_doctor: string;
  comment: string;
}
