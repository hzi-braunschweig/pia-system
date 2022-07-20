/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { GenericFieldDescription } from '../../models/compliance';
import { SegmentType, TemplateSegment } from '../../models/Segments';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { StudyAccess } from '../../models/studyAccess';
import { ProfessionalAccount } from '../../models/professionalAccount';

describe('UserService', () => {
  let httpMock: HttpTestingController;
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService],
      imports: [HttpClientTestingModule],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UserService);
  });

  describe('getStudyAccesses()', () => {
    it('should get all study accesses of a study', (done) => {
      const studyAccesses: StudyAccess[] = [createStudyAccess()];

      service.getStudyAccesses('Teststudy').then((response) => {
        expect(response).toEqual(studyAccesses);
        done();
      });
      const mockReq = httpMock.expectOne(
        `api/v1/user/studies/Teststudy/accesses`
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush(studyAccesses);
      httpMock.verify();
    });
  });

  describe('deleteUserFromStudy()', () => {
    it('should delete a study access of a user from a study', (done) => {
      service.deleteUserFromStudy('DeleteMe', 'Teststudy').then((textObj) => {
        done();
      });

      const mockReq = httpMock.expectOne(
        `api/v1/user/studies/Teststudy/accesses/DeleteMe`
      );
      expect(mockReq.request.method).toBe('DELETE');
      mockReq.flush(null);
      httpMock.verify();
    });
  });

  describe('postStudyAccess()', () => {
    it('should create a study access', (done) => {
      const studyAccess = createStudyAccess();

      service.postStudyAccess(studyAccess).then((result) => {
        expect(result).toEqual(studyAccess);
        done();
      });

      const mockReq = httpMock.expectOne(
        `api/v1/user/studies/Teststudy/accesses`
      );
      expect(mockReq.request.method).toBe('POST');
      mockReq.flush(studyAccess);
      httpMock.verify();
    });
  });

  describe('putStudyAccess()', () => {
    it('should update a study access', (done) => {
      const studyAccess = createStudyAccess();

      service.putStudyAccess(studyAccess).then((result) => {
        expect(result).toEqual(studyAccess);
        done();
      });

      const mockReq = httpMock.expectOne(
        `api/v1/user/studies/Teststudy/accesses/SomeProfessional`
      );
      expect(mockReq.request.method).toBe('PUT');
      mockReq.flush(studyAccess);
      httpMock.verify();
    });
  });

  describe('getProfessionalAccounts()', () => {
    it('should get all professional accounts filtered by given criteria', (done) => {
      const professionalAccounts: ProfessionalAccount[] = [
        {
          username: 'SomeProfessional',
          role: 'Forscher',
          studies: ['Teststudy'],
        },
      ];

      service.getProfessionalAccounts({}).then((result) => {
        expect(result).toEqual(professionalAccounts);
        done();
      });

      const mockReq = httpMock.expectOne(`api/v1/user/accounts`);
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush(professionalAccounts);
      httpMock.verify();
    });
  });

  function createStudyAccess(): StudyAccess {
    return {
      studyName: 'Teststudy',
      username: 'SomeProfessional',
      accessLevel: 'admin',
    };
  }
});
