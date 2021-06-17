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
      this.hasStudyAccess(user, this.studyName) &&
      (this.searchString === '' ||
        this.containsString(user, this.searchString)) &&
      (this.isTestproband === null ||
        user.is_test_proband === this.isTestproband)
    );
  }

  /**
   * Checks if user has access to given study
   *
   * @param user user object
   * @param studyName name of the study which will be checked against
   */
  private hasStudyAccess(user: TranslatedUser, studyName: string): boolean {
    return user.study_accesses.includes(studyName + ' (');
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
