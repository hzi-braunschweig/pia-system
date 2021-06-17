import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { StudyAccess } from '../psa.app.core/models/user-with-study-access';
import { StudyAccessPipe } from './study-access.pipe';

describe('StudyAccessPipe', () => {
  let pipe: StudyAccessPipe;
  let translate: TranslateService;

  beforeEach(() => {
    translate = jasmine.createSpyObj('TranslateService', ['instant']);

    TestBed.configureTestingModule({
      providers: [
        StudyAccessPipe,
        { provide: TranslateService, useValue: translate },
      ],
    });
    pipe = TestBed.get(StudyAccessPipe);
  });

  describe('transform', () => {
    it('should transform study access list with one entry', () => {
      (translate.instant as jasmine.Spy).and.returnValue('Lesen');
      expect(pipe.transform([getStudyAccess()])).toEqual('RESIST (Lesen)');
    });

    it('should transform study access list with multiple entries', () => {
      (translate.instant as jasmine.Spy).and.returnValue('Lesen');
      expect(
        pipe.transform([getStudyAccess(), getStudyAccess('NAKO')])
      ).toEqual('RESIST (Lesen), NAKO (Lesen)');
    });
  });

  function getStudyAccess(study_id: string = 'RESIST'): StudyAccess {
    return { study_id, access_level: 'read' };
  }
});
