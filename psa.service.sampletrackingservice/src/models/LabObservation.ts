/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface LabObservation {
  id?: string;
  lab_result_id?: string | null;
  name_id: number;
  name?: string | null;
  result_value?: string | null;
  comment?: string | null;
  date_of_analysis?: Date | null;
  date_of_delivery?: Date | null;
  date_of_announcement?: Date | null;
  lab_name?: string | null;
  material?: string | null;
  result_string?: string | null;
  unit?: string | null;
  other_unit?: string | null;
  kit_name?: string | null;
}
