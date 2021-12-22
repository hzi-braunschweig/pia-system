/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TranslatedUser } from './translated-user.model';

/**
 * Encapsulates logic for TranslatedUsers filtering
 */
export class TranslatedUserFilter {
  studyName: string | null = null;
  searchString = '';
  isTestproband: string | null = null;

  /**
   * Returns a string which represents the currently set filter values.
   * Can be used to check if the filters have changed.
   */
  get filterKey(): string {
    return `${this.studyName}_${this.searchString}_${this.isTestproband}`;
  }

  /**
   * Returns true for users which apply to the currently active filter criterias
   *
   * Filters all entries if no study is set.
   *
   * @param user list of users to filter
   */
  filter(user: TranslatedUser): boolean {
    return (
      user.study === this.studyName &&
      (this.searchString === '' ||
        this.containsString(user, this.searchString)) &&
      (this.isTestproband === null ||
        user.is_test_proband === this.isTestproband)
    );
  }

  /**
   * Searches for a searchString within the user object's properties
   *
   * Is case insensitive and trims values before comparison. Works only with string values.
   *
   * @param user user which will be searched in
   * @param searchString search string
   */
  private containsString(user: TranslatedUser, searchString: string): boolean {
    return Object.values(user)
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .some((value) => value.includes(searchString.trim().toLowerCase()));
  }
}
