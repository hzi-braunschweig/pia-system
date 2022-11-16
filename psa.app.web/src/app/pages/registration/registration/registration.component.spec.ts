/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture } from '@angular/core/testing';

import { RegistrationComponent } from './registration.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { MockBuilder, MockRender } from 'ng-mocks';
import Keycloak from 'keycloak-js';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../../environments/environment';
import createSpyObj = jasmine.createSpyObj;
import createSpy = jasmine.createSpy;
import stringContaining = jasmine.stringContaining;
import SpyObj = jasmine.SpyObj;

describe('RegistrationComponent', () => {
  const redirectSpy = createSpy();
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let keycloakMock: SpyObj<Keycloak>;

  const expectedStudy = 'mock-study';
  const expectedUrl =
    'https://localhost/registration/url/from/keycloak/service';

  beforeEach(async () => {
    keycloakMock = createSpyObj<Keycloak>(['createRegisterUrl']);
    keycloakMock.createRegisterUrl.and.callFake(() => {
      return expectedUrl;
    });
    const keycloakServiceMock = createSpyObj<KeycloakService>([
      'getKeycloakInstance',
    ]);

    keycloakServiceMock.getKeycloakInstance.and.returnValue(keycloakMock);

    await MockBuilder(RegistrationComponent)
      .provide({
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ study: expectedStudy }),
          },
        },
      })
      .mock(KeycloakService, keycloakServiceMock)
      .mock(DOCUMENT, document);

    RegistrationComponent.prototype['redirect'] = redirectSpy;

    fixture = MockRender(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should redirect to keycloak registration page with study parameter', () => {
    expect(keycloakMock.createRegisterUrl).toHaveBeenCalledOnceWith({
      redirectUri: environment.baseUrl,
    });
    expect(redirectSpy).toHaveBeenCalledOnceWith(
      stringContaining(`study=${expectedStudy}`)
    );
    expect(redirectSpy).toHaveBeenCalledOnceWith(stringContaining(expectedUrl));
  });
});
