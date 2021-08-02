/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type SystemLogType =
  | 'personal'
  | 'proband'
  | 'sample'
  | 'study'
  | 'compliance'
  | 'study_change'
  | 'partial';

export interface SystemLog {
  requestedBy: string;
  requestedFor: string;
  timestamp: Date;
  type: SystemLogType;
}

export interface SystemLogFilter {
  fromTime?: string;
  toTime?: string;
  types: SystemLogType[];
}
