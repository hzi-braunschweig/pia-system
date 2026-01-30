/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { RegistrationComponent } from './registration.component';
import { MockBuilder, MockRender } from 'ng-mocks';
import { KeycloakClientService } from '../auth/keycloak-client.service';
import { RedirectService } from '../shared/services/redirect/redirect.service';
import SpyObj = jasmine.SpyObj;
import stringContaining = jasmine.stringContaining;

describe('RegistrationComponent', () => {
  let fixture: ComponentFixture<RegistrationComponent>;
  let component: RegistrationComponent;
  let keycloakClientService: SpyObj<KeycloakClientService>;
  let redirectService: SpyObj<RedirectService>;
  let activatedRoute: SpyObj<ActivatedRoute>;
  const expectedUrl =
    'https://localhost/registration/url/from/keycloak/service';

  beforeEach(async () => {
    keycloakClientService = jasmine.createSpyObj('KeycloakClientService', [
      'createRegisterUrl',
    ]);
    keycloakClientService.createRegisterUrl.and.returnValue(expectedUrl);

    redirectService = jasmine.createSpyObj('RedirectService', ['redirectTo']);

    activatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('test-study'),
        },
      },
    });

    await MockBuilder(RegistrationComponent)
      .mock(KeycloakClientService, keycloakClientService)
      .mock(RedirectService, redirectService)
      .mock(ActivatedRoute, activatedRoute);
  });

  it('should create registration URL and redirect to it', async () => {
    fixture = MockRender(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(keycloakClientService.createRegisterUrl).toHaveBeenCalledWith(
      'test-study'
    );
    expect(redirectService.redirectTo).toHaveBeenCalledOnceWith(
      stringContaining(expectedUrl)
    );
  });

  it('should throw error if no study parameter is provided', async () => {
    const modifiedActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
        },
      },
    });

    await MockBuilder(RegistrationComponent)
      .mock(KeycloakClientService, keycloakClientService)
      .mock(RedirectService, redirectService)
      .mock(ActivatedRoute, modifiedActivatedRoute);

    const errorFixture = MockRender(RegistrationComponent);
    const errorComponent = errorFixture.componentInstance;

    await expectAsync(errorComponent.ngOnInit()).toBeRejectedWithError(
      'No study parameter provided in the URL'
    );
    expect(redirectService.redirectTo).not.toHaveBeenCalled();
  });
});
