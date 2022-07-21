/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type UserFileDto = Pick<UserFile, 'id' | 'file' | 'file_name'>;

export interface UserFile {
  id: number;
  user_id: string;
  questionnaire_instance_id: number;
  answer_option_id: number;
  file_name?: string;
  file: string;
}
