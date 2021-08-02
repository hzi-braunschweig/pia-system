/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { ComplianceService } from './compliance-service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HTTPMethod } from '@pact-foundation/pact/src/common/request';
import { PactWeb } from '@pact-foundation/pact/src/pact-web';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { like, somethingLike } from '@pact-foundation/pact/src/dsl/matchers';
import { AuthInterceptor } from '../../../_interceptors/auth-interceptor';
import { GenericFieldDescription } from '../../models/compliance';
import { SegmentType, TemplateSegment } from '../../models/Segments';

class MockAuthManager {
  currentUser = {
    username: 'Testproband1',
    token: 'ValidToken',
  };
}

describe('ComplianceService', () => {
  let provider: PactWeb;
  let service: ComplianceService;

  beforeAll(async () => {
    provider = new PactWeb({ port: 14010 });
    await provider.removeInteractions(); // in case of `singleRun: false`
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationManager, useClass: MockAuthManager },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        ComplianceService,
      ],
      imports: [HttpClientModule],
    });
    service = TestBed.inject(ComplianceService);
  });
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('get is internal compliance active', () => {
    it('gets weather the internal compliance is active', async () => {
      await provider.addInteraction({
        state: 'the internal compliance for Teststudie1 is activated',
        uponReceiving: 'get internal compliance is active',
        withRequest: {
          method: HTTPMethod.GET,
          headers: {
            Authorization: 'ValidToken',
          },
          path: `/api/v1/compliance/Teststudie1/active`,
        },
        willRespondWith: {
          status: 200,
          body: true,
        },
      });

      const isActive = await service.getInternalComplianceActive('Teststudie1');
      expect(isActive).toBeTrue();
    });
  });

  describe('get compliance text', () => {
    it('gets the existing text', async () => {
      await provider.addInteraction({
        state: 'a compliance text for Teststudie1 exists',
        uponReceiving: 'get compliance text',
        withRequest: {
          method: HTTPMethod.GET,
          headers: {
            Authorization: 'ValidToken',
          },
          path: `/api/v1/compliance/Teststudie1/text`,
        },
        willRespondWith: {
          status: 200,
          body: like({
            to_be_filled_by: 'Proband',
            compliance_text:
              '<pia-consent-input-radio-app></pia-consent-input-radio-app>',
          }),
        },
      });

      const text = await service
        .getComplianceText('Teststudie1')
        .then((textObj) => textObj.compliance_text);
      expect(text).toEqual(
        '<pia-consent-input-radio-app></pia-consent-input-radio-app>'
      );
    });
  });

  describe('get generic fields', () => {
    beforeAll(async () => {
      await provider.addInteraction({
        state: 'generic compliance fields exist for the study',
        uponReceiving: 'a request to GET generic compliance fields',
        withRequest: {
          method: HTTPMethod.GET,
          path: `/api/v1/compliance/Teststudie1/questionnaire-placeholder`,
        },
        willRespondWith: {
          status: 200,
          body: somethingLike([
            { type: 'TEXT', placeholder: 'address', label: 'Adresse' },
            { type: 'RADIO', placeholder: 'consent', label: null },
          ]),
        },
      });
    });

    it('gets the generic fields', async () => {
      const result = await service.getGenericFields('Teststudie1');
      expect(result.length).toEqual(2);
    });
  });

  describe('add generic fields', () => {
    beforeAll(async () => {
      await provider.addInteraction({
        state: 'service accepts generic fields',
        uponReceiving: 'a request to POST generic compliance fields',
        withRequest: {
          method: HTTPMethod.POST,
          path: `/api/v1/compliance/Teststudie1/questionnaire-placeholder`,
          body: createGenericFieldDescription(),
        },
        willRespondWith: {
          status: 200,
          body: somethingLike([
            { type: 'TEXT', placeholder: 'address', label: 'Adresse' },
            { type: 'RADIO', placeholder: 'consent', label: null },
          ]),
        },
      });
    });

    it('gets the generic fields', async () => {
      const result = await service.addGenericField(
        'Teststudie1',
        createGenericFieldDescription()
      );
      expect(result.length).toEqual(2);
    });
  });

  describe('get compliance agreement', () => {
    it('gets the existing agreement', async () => {
      await provider.addInteraction({
        state: 'a compliance for user Testproband1 on Teststudie1 exists',
        uponReceiving: 'get Testproband1 agreement on Teststudie1',
        withRequest: {
          method: HTTPMethod.GET,
          headers: {
            Authorization: 'ValidToken',
          },
          path: `/api/v1/compliance/Teststudie1/agree/Testproband1`,
        },
        willRespondWith: {
          status: 200,
          body: {
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
          },
        },
      });
      const auth = TestBed.inject(AuthenticationManager);
      const agreement = await service.getComplianceAgreementForUser(
        'Teststudie1',
        auth.currentUser.username
      );
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
    });

    it('gets null if no agreement exists', async () => {
      await provider.addInteraction({
        state: 'no compliance for user Testproband1 on Teststudie1 exists',
        uponReceiving: 'get Testproband1 agreement on Teststudie1',
        withRequest: {
          method: HTTPMethod.GET,
          headers: {
            Authorization: 'ValidToken',
          },
          path: `/api/v1/compliance/Teststudie1/agree/Testproband1`,
        },
        willRespondWith: {
          status: 200,
          body: '',
        },
      });
      const auth = TestBed.inject(AuthenticationManager);
      const agreement = await service.getComplianceAgreementForUser(
        'Teststudie1',
        auth.currentUser.username
      );
      expect(agreement).toBeNull();
    });
  });

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
