/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture } from '@angular/core/testing';

import { RegistrationComponent } from './registration.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MockBuilder, MockRender } from 'ng-mocks';
import Keycloak from 'keycloak-js';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../../environments/environment';
import createSpy = jasmine.createSpy;
import stringContaining = jasmine.stringContaining;
import SpyObj = jasmine.SpyObj;

describe('RegistrationComponent', () => {
  const redirectSpy = createSpy();
  let fixture: ComponentFixture<RegistrationComponent>;
  let keycloak: SpyObj<Keycloak>;

  const expectedStudy = 'mock-study';
  const expectedUrl =
    'https://localhost/registration/url/from/keycloak/service';

  beforeEach(async () => {
    keycloak = jasmine.createSpyObj('Keycloak', ['createRegisterUrl']);
    keycloak.createRegisterUrl.and.callFake(() => {
      return expectedUrl;
    });

    await MockBuilder(RegistrationComponent)
      .provide({
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ study: expectedStudy }),
          },
        },
      })
      .mock(Keycloak, keycloak)
      .mock(DOCUMENT, document);

    // @ts-expect-error we need to overwrite the private function to prevent a site reload
    RegistrationComponent.prototype.redirect = redirectSpy;

    fixture = MockRender(RegistrationComponent);
    fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should redirect to keycloak registration page with study parameter', () => {
    expect(keycloak.createRegisterUrl).toHaveBeenCalledOnceWith({
      redirectUri: environment.baseUrl,
    });
    expect(redirectSpy).toHaveBeenCalledOnceWith(
      stringContaining(`study=${expectedStudy}`)
    );
    expect(redirectSpy).toHaveBeenCalledOnceWith(stringContaining(expectedUrl));
  });
});
