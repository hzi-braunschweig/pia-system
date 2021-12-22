/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type SystemLogRequestInternalDto = Omit<
  SystemLogInternalDto,
  'timestamp'
>;

export interface SystemLogInternalDto {
  requestedBy: string;
  requestedFor: string;
  timestamp: string;
  type:
    | 'proband'
    | 'sample'
    | 'study'
    | 'compliance'
    | 'study_change'
    | 'partial'
    | 'personal';
}
