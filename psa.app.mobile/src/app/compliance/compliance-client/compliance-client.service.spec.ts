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
import { Platform } from '@ionic/angular';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('ComplianceClientService', () => {
  let complianceService: ComplianceClientService;
  let httpMock: HttpTestingController;
  let currentUser: SpyObj<CurrentUser>;
  let endpoint: SpyObj<EndpointService>;
  let platform: SpyObj<Platform>;

  const apiUrl = 'http://localhost';
  const testStudyName = 'Teststudie';

  beforeEach(() => {
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      username: 'Testuser',
    });

    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    platform = jasmine.createSpyObj('Platform', ['ready', 'is']);
    platform.ready.and.returnValue(Promise.resolve('dom'));

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ComplianceClientService,
        { provide: CurrentUser, useValue: currentUser },
        { provide: EndpointService, useValue: endpoint },
        { provide: Platform, useValue: platform },
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
      spyOn(Filesystem, 'writeFile').and.returnValue(
        Promise.resolve({ uri: 'file://path/to/file.pdf' })
      );
      spyOn(FileOpener, 'openFile').and.returnValue(Promise.resolve());
      spyOn(complianceService as any, 'blobToBase64').and.returnValue(
        Promise.resolve('base64Data')
      );
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        style: { display: '' },
        click: jasmine.createSpy('click'),
        remove: jasmine.createSpy('remove'),
      } as any);
      spyOn(document.body, 'appendChild');
    });

    it('should request the compliance pdf file', async () => {
      platform.is.and.returnValue(true);
      complianceService.getComplianceAgreementPdfForCurrentUser(testStudyName);
      mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
      );
      blob = new Blob(['test content'], { type: 'application/pdf' });
      mockReq.flush(blob);
      expect(mockReq.request.method).toBe('GET');
      httpMock.verify();
    });

    describe('native platform (hybrid)', () => {
      beforeEach(() => {
        platform.is.and.returnValue(true);
      });

      it('should write file to the data directory', fakeAsync(() => {
        complianceService.getComplianceAgreementPdfForCurrentUser(
          testStudyName
        );
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

      it('should open the file with FileOpener', fakeAsync(() => {
        complianceService.getComplianceAgreementPdfForCurrentUser(
          testStudyName
        );
        mockReq = httpMock.expectOne(
          `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
        );
        blob = new Blob(['test content'], { type: 'application/pdf' });
        mockReq.flush(blob);
        tick();
        expect(FileOpener.openFile).toHaveBeenCalledWith({
          path: 'file://path/to/file.pdf',
          mimeType: 'application/pdf',
        });
      }));
    });

    describe('browser platform (non-hybrid)', () => {
      beforeEach(() => {
        platform.is.and.returnValue(false);
      });

      it('should create a download link for browser', fakeAsync(() => {
        complianceService.getComplianceAgreementPdfForCurrentUser(
          testStudyName
        );
        mockReq = httpMock.expectOne(
          `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
        );
        blob = new Blob(['test content'], { type: 'application/pdf' });
        mockReq.flush(blob);
        tick();

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(document.createElement).toHaveBeenCalledWith('a');
      }));

      it('should trigger download and cleanup', fakeAsync(() => {
        const mockLink = {
          href: '',
          download: '',
          style: { display: '' },
          click: jasmine.createSpy('click'),
          remove: jasmine.createSpy('remove'),
        } as unknown as HTMLAnchorElement;
        (document.createElement as jasmine.Spy).and.returnValue(mockLink);

        complianceService.getComplianceAgreementPdfForCurrentUser(
          testStudyName
        );
        mockReq = httpMock.expectOne(
          `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
        );
        blob = new Blob(['test content'], { type: 'application/pdf' });
        mockReq.flush(blob);
        tick();

        expect(mockLink.href).toBe('blob:url');
        expect(mockLink.download).toBe('Einwilligung_Teststudie_Testuser.pdf');
        expect(mockLink.style.display).toBe('none');
        expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.remove).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
      }));

      it('should not use native file operations', fakeAsync(() => {
        complianceService.getComplianceAgreementPdfForCurrentUser(
          testStudyName
        );
        mockReq = httpMock.expectOne(
          `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
        );
        blob = new Blob(['test content'], { type: 'application/pdf' });
        mockReq.flush(blob);
        tick();

        expect(Filesystem.writeFile).not.toHaveBeenCalled();
        expect(FileOpener.openFile).not.toHaveBeenCalled();
      }));
    });
  });
});
