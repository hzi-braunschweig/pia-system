import { TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TranslatedUserFactory } from './translated-user.factory';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { StudyAccessPipe } from '../../../pipes/study-access.pipe';
import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';
import { TranslatedUser } from './translated-user.model';

describe('TranslatedUserFactory', () => {
  let service: TranslatedUserFactory;
  let translate: TranslateService;
  let accountStatusPipe: AccountStatusPipe;
  let studyAccessPipe: StudyAccessPipe;
  let datePipe: DatePipe;

  beforeEach(() => {
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    accountStatusPipe = jasmine.createSpyObj('AccountStatusPipe', [
      'transform',
    ]);
    studyAccessPipe = jasmine.createSpyObj('StudyAccessPipe', ['transform']);
    datePipe = jasmine.createSpyObj('DatePipe', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        TranslatedUserFactory,
        { provide: TranslateService, useValue: translate },
        { provide: AccountStatusPipe, useValue: accountStatusPipe },
        { provide: StudyAccessPipe, useValue: studyAccessPipe },
        { provide: DatePipe, useValue: datePipe },
      ],
    });
    service = TestBed.get(TranslatedUserFactory);
  });

  describe('create()', () => {
    it('should create a TranslatedUser from a UserWithStudyAccess', () => {
      (translate.instant as jasmine.Spy).and.returnValue('Test');
      (accountStatusPipe.transform as jasmine.Spy).and.returnValue(
        'STUDIES.STATUS_ACTIV'
      );
      (studyAccessPipe.transform as jasmine.Spy).and.returnValue(
        'NAKO Test (Lesen)'
      );
      (datePipe.transform as jasmine.Spy).and.returnValue('20.04.2020');

      const selected = getUser();
      const expected: TranslatedUser = {
        username: 'Testproband',
        ids: null,
        study_accesses: 'NAKO Test (Lesen)',
        is_test_proband: 'Test',
        first_logged_in_at: '20.04.2020',
        status: 'Test',
        userObject: selected,
      };

      expect(service.create(selected)).toEqual(expected);
      expect(translate.instant).toHaveBeenCalledTimes(2);
      expect(translate.instant).toHaveBeenCalledWith('GENERAL.NO');
      expect(translate.instant).toHaveBeenCalledWith('STUDIES.STATUS_ACTIV');
    });
  });

  function getUser(): UserWithStudyAccess {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: [{ study_id: 'NAKO Test', access_level: 'read' }],
      is_test_proband: false,
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
