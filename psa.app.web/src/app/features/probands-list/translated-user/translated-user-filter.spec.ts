import { TranslatedUserFilter } from './translated-user-filter';
import { TranslatedUser } from './translated-user.model';
import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';

describe('TranslatedUserFilter', () => {
  let filter: TranslatedUserFilter;

  beforeEach(() => (filter = new TranslatedUserFilter()));

  describe('filterKey', () => {
    it('should return a string of the current filter values', () => {
      filter.studyName = 'NAKO';
      filter.searchString = 'Test';
      filter.isTestproband = null;
      expect(filter.filterKey).toEqual('NAKO_Test_null');
    });
  });

  describe('filter()', () => {
    it('should filter only by study name', () => {
      filter.studyName = 'NAKO';
      expect(filter.filter(getTranslatedUser())).toBe(true);
      filter.studyName = 'RESIST';
      expect(filter.filter(getTranslatedUser())).toBe(false);
      filter.studyName = 'Teststudy1';
      expect(filter.filter(getTranslatedUser())).toBe(false);
      filter.studyName = null;
      expect(filter.filter(getTranslatedUser())).toBe(false);
    });

    it('should filter only by search string case insensitive', () => {
      filter.studyName = 'NAKO';
      filter.searchString = 'Proband';
      expect(filter.filter(getTranslatedUser())).toBe(true);
      filter.searchString = 'CantFindMe';
      expect(filter.filter(getTranslatedUser())).toBe(false);
      filter.searchString = '';
      expect(filter.filter(getTranslatedUser())).toBe(true);
    });

    it('should filter only by isTestproband', () => {
      filter.studyName = 'NAKO';
      filter.isTestproband = 'Ja';
      expect(filter.filter(getTranslatedUser())).toBe(true);
      filter.isTestproband = 'Nein';
      expect(filter.filter(getTranslatedUser())).toBe(false);
      filter.isTestproband = null;
      expect(filter.filter(getTranslatedUser())).toBe(true);
    });

    it('should combine filters', () => {
      filter.studyName = 'NAKO';
      filter.searchString = 'Proband';
      filter.isTestproband = 'Ja';
      expect(filter.filter(getTranslatedUser())).toBe(true);

      filter.studyName = 'NAKO';
      filter.searchString = 'CantFindMe';
      filter.isTestproband = 'Nein';
      expect(filter.filter(getTranslatedUser())).toBe(false);

      filter.studyName = null;
      filter.searchString = '';
      filter.isTestproband = null;
      expect(filter.filter(getTranslatedUser())).toBe(false);
    });

    it('should filter out empty study names', () => {
      filter.studyName = null;
      filter.searchString = 'some search';
      filter.isTestproband = null;
      expect(filter.filter(getTranslatedUser())).toBe(false);
    });
  });

  function getTranslatedUser(): TranslatedUser {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: 'NAKO (Lesen)',
      is_test_proband: 'Ja',
      first_logged_in_at: '12.02.2019',
      status: 'Aktiv',
      userObject: getUser(),
    };
  }

  function getTranslatedUser2(): TranslatedUser {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: 'Teststudy (Lesen)',
      is_test_proband: 'Ja',
      first_logged_in_at: '12.02.2019',
      status: 'Aktiv',
      userObject: getUser(),
    };
  }

  function getUser(): UserWithStudyAccess {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: [{ study_id: 'NAKO Test', access_level: 'read' }],
      is_test_proband: true,
      first_logged_in_at: '2020-04-20T00:00:00.000Z',
      account_status: 'active',
      study_status: 'active',
      age: 20,
      password: null,
      sex: null,
      studyNamesArray: [],
      needs_material: false,
      role: 'Proband',
      compliance_bloodsamples: false,
      compliance_labresults: false,
      compliance_samples: false,
    };
  }
});
