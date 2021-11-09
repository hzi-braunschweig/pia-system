/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface UserLogFilter {
  fromTime?: Date;
  toTime?: Date;
}

export interface SystemLogRequest {
  requestedBy: string;
  requestedFor: string;
  type: string;
}

export interface SystemLogResponse {
  requestedBy: string;
  requestedFor: string;
  timestamp: Date;
  type:
    | 'proband'
    | 'sample'
    | 'study'
    | 'compliance'
    | 'study_change'
    | 'partial';
}
