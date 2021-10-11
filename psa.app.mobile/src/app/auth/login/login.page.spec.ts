/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

import { LoginPage } from './login.page';
import { AuthClientService } from '../auth-client.service';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { AuthModule } from '../auth.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { User } from '../auth.model';
import SpyObj = jasmine.SpyObj;

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: MockedComponentFixture<LoginPage>;

  let loadingCtrl: SpyObj<LoadingController>;
  let authClient: SpyObj<AuthClientService>;
  let router: SpyObj<Router>;
  let alertCtrl: SpyObj<AlertController>;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(async () => {
    loadingCtrl = jasmine.createSpyObj(LoadingController, ['create']);
    authClient = jasmine.createSpyObj(AuthClientService, [
      'login',
      'loginWithToken',
    ]);
    router = jasmine.createSpyObj(Router, ['navigate']);
    alertCtrl = jasmine.createSpyObj(AlertController, ['create']);
    endpoint = jasmine.createSpyObj(EndpointService, [
      'setEndpointForUser',
      'isEndpointCompatible',
    ]);

    const loading = {
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve(true),
    } as HTMLIonLoadingElement;
    loadingCtrl.create.and.resolveTo(loading);

    const alert = {
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve(true),
    } as HTMLIonAlertElement;
    alertCtrl.create.and.resolveTo(alert);

    await MockBuilder(LoginPage, AuthModule)
      .mock(EndpointService, endpoint)
      .mock(AlertController, alertCtrl)
      .mock(LoadingController, loadingCtrl)
      .mock(AuthClientService, authClient)
      .mock(Router, router);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(LoginPage);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
    tick(); // wait for init to finish
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('login', () => {
    it('should set the endpoint and send a login request', async () => {
      const username = 'Test-1234567890';
      endpoint.setEndpointForUser.and.returnValue(true);
      endpoint.isEndpointCompatible.and.resolveTo(true);
      authClient.login.and.resolveTo(createUser({ username }));
      component.username = username;
      await component.login();
      expect(authClient.login).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledOnceWith(['home']);
    });
  });
});

function createUser(overwrite: Partial<User> = {}): User {
  return {
    compliance_bloodsamples: false,
    compliance_labresults: false,
    compliance_samples: false,
    examination_wave: 0,
    first_logged_in_at: '',
    id: 0,
    logged_in_with: '',
    logging_active: false,
    needs_material: false,
    password: '',
    pw_change_needed: false,
    role: '',
    study_center: '',
    token_login:
      btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      btoa(
        JSON.stringify({
          id: 2,
          username: overwrite?.username ?? '',
          iat: Date.now(),
          exp: Date.now() + 60000,
        })
      ) +
      '.' +
      btoa('signature'),
    username: '',
    token:
      btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      btoa(
        JSON.stringify({
          id: 1,
          role: 'Proband',
          username: overwrite?.username ?? '',
          groups: ['test study'],
          locale: 'de-DE',
          app: 'web',
          iat: Date.now(),
          exp: Date.now() + 60000,
        })
      ) +
      '.' +
      btoa('signature'),
  };
}
