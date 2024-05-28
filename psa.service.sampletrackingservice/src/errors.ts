/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class LabResultNotFound extends Error {}
export class LabResultDeleted extends Error {}
export class LabResultDummyIdDoesNotMatch extends Error {}
export class ParticipantComplianceIsMissing extends Error {}

export type Exceptions =
  | LabResultNotFound
  | LabResultDeleted
  | LabResultDummyIdDoesNotMatch;
