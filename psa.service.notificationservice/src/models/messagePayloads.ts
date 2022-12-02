/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface MessagePayloadProbandDeactivated {
  pseudonym: string;
}

export interface MessagePayloadProbandDeleted {
  pseudonym: string;
}
