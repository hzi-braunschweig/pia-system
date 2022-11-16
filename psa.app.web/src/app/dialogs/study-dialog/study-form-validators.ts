/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const defaultPseudonymSuffixLength = 8;

export const requireMaxAllowedAccountsCountForOpenSelfRegistration: ValidatorFn =
  (control: AbstractControl): ValidationErrors | null => {
    const hasOpenSelfRegistration = control.get(
      'has_open_self_registration'
    ).value;
    const maxAllowedAccountsCount = control.get(
      'max_allowed_accounts_count'
    ).value;

    return hasOpenSelfRegistration === true && !maxAllowedAccountsCount
      ? { requireMaxAllowedAccountsCountForOpenSelfRegistration: true }
      : null;
  };

export const maxAllowedAccountsCountLimit: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const pseudonymSuffixLength =
    control.get('pseudonym_suffix_length').value ??
    defaultPseudonymSuffixLength;
  const maxAllowedAccountsCount = control.get(
    'max_allowed_accounts_count'
  ).value;
  const possiblePseudonymsCount = 10 ** pseudonymSuffixLength;
  const maxRecruitmentLimit = possiblePseudonymsCount * 0.1; // we allow only 10% of possible pseudonyms as limit

  return maxAllowedAccountsCount &&
    maxAllowedAccountsCount > maxRecruitmentLimit
    ? { maxRecruitmentLimit: true }
    : null;
};
