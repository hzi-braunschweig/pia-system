import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import SpyObj = jasmine.SpyObj;

import { ComplianceClientService } from './compliance-client.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/auth.model';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';

describe('ComplianceClientService', () => {
  let complianceService: ComplianceClientService;
  let httpMock: HttpTestingController;
  let file: SpyObj<File>;
  let fileOpener: SpyObj<FileOpener>;
  let auth: SpyObj<AuthService>;
  let endpoint: SpyObj<EndpointService>;

  const apiUrl = 'http://localhost';
  const testStudyName = 'Teststudie';

  beforeEach(() => {
    file = jasmine.createSpyObj('File', ['writeFile']);
    file.dataDirectory = '/some/path';
    file.writeFile.and.returnValue(
      Promise.resolve({ toURL: () => '/some/path/somefile.pdf' })
    );
    fileOpener = jasmine.createSpyObj('FileOpener', ['open']);
    fileOpener.open.and.returnValue(Promise.resolve());
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    auth.getCurrentUser.and.returnValue({ username: 'Testuser' } as User);
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [
        ComplianceClientService,
        { provide: File, useValue: file },
        { provide: FileOpener, useValue: fileOpener },
        { provide: AuthService, useValue: auth },
        { provide: EndpointService, useValue: endpoint },
      ],
      imports: [HttpClientTestingModule],
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

    beforeEach(async () => {
      await complianceService.getComplianceAgreementPdfForCurrentUser(
        testStudyName
      );
      mockReq = httpMock.expectOne(
        `${apiUrl}/api/v1/compliance/${testStudyName}/agree-pdf/Testuser`
      );
      blob = new Blob();
      mockReq.flush(blob);
    });

    it('should request the compliance pdf file', async () => {
      expect(mockReq.request.method).toBe('GET');
      httpMock.verify();
    });

    it('should write file to the data directory', async () => {
      expect(file.writeFile).toHaveBeenCalledWith(
        '/some/path',
        'Einwilligung_Teststudie_Testuser.pdf',
        blob,
        { replace: true }
      );
    });

    it('should open the file', () => {
      expect(fileOpener.open).toHaveBeenCalledWith(
        '/some/path/somefile.pdf',
        'application/pdf'
      );
    });
  });
});
