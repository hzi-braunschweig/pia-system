/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface JournalPersonDto {
  uuid: string;
  pseudonymized: boolean;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phone: string;
  birthdateDD: number;
  birthdateMM: number;
  birthdateYYYY: number;
  sex: 'Male' | 'Female' | 'Other' | 'Unknown';
  latestFollowUpEndDate: Date | null;
  followUpStatus:
    | 'Under follow-up'
    | 'Completed follow-up'
    | 'Canceled follow-up'
    | 'Lost follow-up'
    | 'No follow-up';
}
