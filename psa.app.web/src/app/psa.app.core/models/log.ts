/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Log {
  id: string;
  timestamp: string;
  toDate: string;
  fromDate: string;
  activity: {
    type: string;
    questionnaireID: string;
    questionnaireName: string;
    questionnaireInstanceId: string;
  };
}
