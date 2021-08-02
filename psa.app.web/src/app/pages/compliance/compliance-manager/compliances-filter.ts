/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComplianceAgreement } from '../../../psa.app.core/models/compliance';

/**
 * Encapsulates logic for Compliances filtering
 */
export class CompliancesFilter {
  studyName: string | null = null;
  searchString = '';

  /**
   * Returns a string which represents the currently set filter values.
   * Can be used to check if the filters have changed.
   */
  get filterKey(): string {
    return `${this.studyName}_${this.searchString}`;
  }

  /**
   * Returns true for compliances which apply to the currently active filter criterias
   *
   * Filters all entries if no study is set.
   *
   * @param compliance list of compliances to filter
   */
  filter(compliance: ComplianceAgreement): boolean {
    return (
      this.hasStudy(compliance, this.studyName) &&
      (this.searchString === '' ||
        this.containsString(compliance, this.searchString))
    );
  }

  /**
   * Checks if compliance has the given study
   *
   * @param compliance compliance object
   * @param studyName name of the study which will be checked against
   */
  private hasStudy(
    compliance: ComplianceAgreement,
    studyName: string
  ): boolean {
    return compliance.study === studyName;
  }

  /**
   * Searches for a searchString within the compliance object's properties
   *
   * Is case insensitive and trims values before comparison. Works only with string values.
   *
   * @param compliance compliance which will be searched in
   * @param searchString search string
   */
  private containsString(
    compliance: ComplianceAgreement,
    searchString: string
  ): boolean {
    return Object.values(compliance)
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .some((value) => value.includes(searchString.trim().toLowerCase()));
  }
}
