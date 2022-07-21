/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface SystemLogReq {
  requestedBy: string;
  requestedFor: string;
  timestamp?: Date;
  type: string;
}

export interface SystemLogRes {
  requestedBy: string;
  requestedFor: string;
  timestamp: Date;
  type: string;
}

export interface SystemLogDb {
  requested_by: string;
  requested_for: string;
  timestamp: string;
  type: string;
}

export interface SystemLogFilter {
  fromTime: Date;
  toTime: Date;
  types: string[];
}
