/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { ComplianceService } from './compliance-service';
import { HTTP_INTERCEPTORS, HttpRequest } from '@angular/common/http';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { AuthInterceptor } from '../../../_interceptors/auth-interceptor';
import { GenericFieldDescription } from '../../models/compliance';
import { SegmentType, TemplateSegment } from '../../models/Segments';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

describe('ComplianceService', () => {
  let httpMock: HttpTestingController;
  let service: ComplianceService;

  const testStudyName = 'Teststudie1';

  beforeEach(() => {
    const authMock = jasmine.createSpyObj<AuthenticationManager>(
      'AuthenticationManager',
      ['getToken']
    );
    authMock.getToken.and.returnValue('ValidToken');

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationManager, useValue: authMock },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        ComplianceService,
      ],
      imports: [HttpClientTestingModule],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ComplianceService);
  });

  describe('getInternalComplianceActive()', () => {
    it('should return true if current study has an internal compliance', (done) => {
      service.getInternalComplianceActive(testStudyName).then((res) => {
        expect(String(res)).toEqual('true');
        done();
      });
      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(`api/v1/compliance/${testStudyName}/active`)
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush('true');
      httpMock.verify();
    });

    it('should return false if current study has no internal compliance', (done) => {
      service.getInternalComplianceActive(testStudyName).then((res) => {
        expect(String(res)).toEqual('false');
        done();
      });
      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(`api/v1/compliance/${testStudyName}/active`)
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush('false');
      httpMock.verify();
    });
  });

  describe('getComplianceText()', () => {
    it('should return compliance text', (done) => {
      service.getComplianceText(testStudyName).then((textObj) => {
        expect(textObj.compliance_text).toEqual(
          '<pia-consent-input-radio-app></pia-consent-input-radio-app>'
        );
        done();
      });

      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(`api/v1/compliance/${testStudyName}/text`)
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush({
        to_be_filled_by: 'Proband',
        compliance_text:
          '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
      });
      httpMock.verify();
    });
  });

  describe('getGenericFields()', () => {
    it('should return generic field descriptions', (done) => {
      service.getGenericFields(testStudyName).then((result) => {
        expect(result.length).toBe(2);
        done();
      });

      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(
          `api/v1/compliance/${testStudyName}/questionnaire-placeholder`
        )
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush([
        { type: 'TEXT', placeholder: 'address', label: 'Adresse' },
        { type: 'RADIO', placeholder: 'consent', label: null },
      ]);
      httpMock.verify();
    });
  });

  describe('addGenericField()', () => {
    it('should add generic compliance fields', (done) => {
      service
        .addGenericField(testStudyName, createGenericFieldDescription())
        .then((result) => {
          expect(result.length).toBe(2);
          done();
        });

      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(
          `api/v1/compliance/${testStudyName}/questionnaire-placeholder`
        )
      );
      expect(mockReq.request.method).toBe('POST');
      mockReq.flush([
        { type: 'TEXT', placeholder: 'address', label: 'Adresse' },
        { type: 'RADIO', placeholder: 'consent', label: null },
      ]);
      httpMock.verify();
    });
  });

  describe('getComplianceAgreementForUser()', () => {
    it('should get Testproband1 agreement on Teststudie1', (done) => {
      service
        .getComplianceAgreementForUser('Teststudie1', 'Testproband1')
        .then((agreement) => {
          expect(agreement).toBeTruthy();
          expect(agreement).toEqual({
            compliance_text_object: createComplianceTextObjectMock(),
            compliance_system: {
              labresults: false,
              samples: false,
              bloodsamples: true,
              app: true,
            },
            compliance_questionnaire: [{ name: 'test', value: true }],
            textfields: {
              firstname: 'Max',
              lastname: 'Mustermann',
              birthdate: new Date('1990-01-01'),
              location: 'Braunschweig',
            },
            timestamp: new Date('2020-06-03T16:27:32.449Z'),
          });
          done();
        });

      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(
          `api/v1/compliance/${testStudyName}/agree/Testproband1`
        )
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush({
        compliance_text_object: createComplianceTextObjectMock(),
        compliance_system: {
          labresults: false,
          samples: false,
          bloodsamples: true,
          app: true,
        },
        compliance_questionnaire: [{ name: 'test', value: true }],
        textfields: {
          firstname: 'Max',
          lastname: 'Mustermann',
          birthdate: '1990-01-01',
          location: 'Braunschweig',
        },
        timestamp: '2020-06-03T16:27:32.449Z',
      });
      httpMock.verify();
    });

    it('should get null if no agreement exists', (done) => {
      service
        .getComplianceAgreementForUser('Teststudie1', 'Testproband1')
        .then((agreement) => {
          expect(agreement).toBeNull();
          done();
        });
      const mockReq = httpMock.expectOne(
        urlWithAuthHeader(
          `api/v1/compliance/${testStudyName}/agree/Testproband1`
        )
      );
      expect(mockReq.request.method).toBe('GET');
      mockReq.flush(null);
      httpMock.verify();
    });
  });

  function urlWithAuthHeader(
    url: string
  ): (req: HttpRequest<unknown>) => boolean {
    return (req) => {
      return (
        req.url === url && req.headers.get('Authorization') === 'ValidToken'
      );
    };
  }

  function createGenericFieldDescription(): GenericFieldDescription {
    return { type: 'TEXT', placeholder: 'address', label: 'Adresse' };
  }

  function createComplianceTextObjectMock(): TemplateSegment[] {
    return [
      { type: SegmentType.HTML, html: '<h1 id="hello">Hello</h1>' },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-radio-app',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-radio-samples',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-radio-bloodsamples',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-radio-labresults',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-text-birthdate',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-text-firstname',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-text-lastname',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [],
        children: [],
        tagName: 'pia-consent-input-text-date',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [
          { name: 'name', value: 'childName' },
          { name: 'label', value: 'Name des Kindes' },
        ],
        children: [],
        tagName: 'pia-consent-input-text-generic',
      },
      {
        type: SegmentType.CUSTOM_TAG,
        attrs: [{ name: 'name', value: 'addiction' }],
        children: [],
        tagName: 'pia-consent-input-radio-generic',
      },
      { type: SegmentType.HTML, html: '<p>\nHallo</p>' },
    ];
  }
});
