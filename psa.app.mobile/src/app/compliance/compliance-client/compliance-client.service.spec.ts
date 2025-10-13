/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ComplianceClientService } from './compliance-client.service';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { CurrentUser } from '../../auth/current-user.service';
import SpyObj = jasmine.SpyObj;
import { Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('ComplianceClientService', () => {
  let complianceService: ComplianceClientService;
  let httpMock: HttpTestingController;
  let currentUser: SpyObj<CurrentUser>;
  let endpoint: SpyObj<EndpointService>;

  const apiUrl = 'http://localhost';
  const testStudyName = 'Teststudie';

  beforeEach(() => {
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      username: 'Testuser',
    });

    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ComplianceClientService,
        { provide: CurrentUser, useValue: currentUser },
        { provide: EndpointService, useValue: endpoint },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    complianceService = TestBed.inject(ComplianceClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('getInternalComplianceActive()', () => {
    it('should return true if current study has an internal compliance', async () => {
      complianceService
        .getInternalComplianceActive(testStudyName)
        .then((res) => {
          expect(String(res)).toEqual('true');
        });
      const mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/active`
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush('true');
      httpMock.verify();
    });

    it('should return false if current study has no internal compliance', async () => {
      complianceService
        .getInternalComplianceActive(testStudyName)
        .then((res) => {
          expect(String(res)).toEqual('false');
        });
      const mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/active`
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush('false');
      httpMock.verify();
    });
  });

  describe('getComplianceAgreementPdfForCurrentUser()', () => {
    let mockReq;
    let blob;

    beforeEach(() => {
      spyOn(Filesystem, 'writeFile').and.callThrough();
      spyOn(FileOpener, 'openFile');
      spyOn(complianceService as any, 'blobToBase64').and.returnValue(
        Promise.resolve('base64Data')
      );
    });

    it('should request the compliance pdf file', async () => {
      complianceService.getComplianceAgreementPdfForCurrentUser(testStudyName);
      mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
      );
      blob = new Blob(['test content'], { type: 'application/pdf' });
      mockReq.flush(blob);
      expect(mockReq.request.method).toBe('GET');
      httpMock.verify();
    });

    it('should write file to the data directory', fakeAsync(() => {
      complianceService.getComplianceAgreementPdfForCurrentUser(testStudyName);
      mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
      );
      blob = new Blob(['test content'], { type: 'application/pdf' });
      mockReq.flush(blob);
      tick();
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        directory: 'DATA',
        path: 'files/Einwilligung_Teststudie_Testuser.pdf',
        data: 'base64Data',
        recursive: true,
      });
    }));

    it('should open the file', fakeAsync(() => {
      complianceService.getComplianceAgreementPdfForCurrentUser(testStudyName);
      mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
      );
      blob = new Blob(['test content'], { type: 'application/pdf' });
      mockReq.flush(blob);
      tick();
      expect(FileOpener.openFile).toHaveBeenCalledWith({
        path: 'path',
        mimeType: 'application/pdf',
      });
    }));
  });
});
