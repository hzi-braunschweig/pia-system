/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoginPasswordLegacyComponent } from './login-password-legacy.component';
import { MockBuilder } from 'ng-mocks';
import { AuthModule } from '../auth.module';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { createLoginResponse } from '../auth.model.spec';
import { AuthClientService } from '../auth-client.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import { TranslateService } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('LoginPasswordLegacyComponent', () => {
  let component: LoginPasswordLegacyComponent;
  let fixture: ComponentFixture<LoginPasswordLegacyComponent>;

  let auth: SpyObj<AuthService>;
  let authClient: SpyObj<AuthClientService>;
  let router: SpyObj<Router>;
  let platform: SpyObj<Platform>;
  let appVersion: SpyObj<AppVersion>;
  let endpoint: SpyObj<EndpointService>;
  let alertCtrl: SpyObj<AlertController>;
  let alert: SpyObj<HTMLIonAlertElement>;
  let loadingCtrl: SpyObj<LoadingController>;
  let toastPresenter: SpyObj<ToastPresenterService>;

  const username = 'TEST-0001';

  beforeEach(() =>
    MockBuilder(LoginPasswordLegacyComponent, AuthModule)
      .mock(Router)
      .mock(TranslateService, { instant: (x) => x })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(LoginPasswordLegacyComponent);
      component = fixture.componentInstance;
      component.username = username;
      fixture.detectChanges();

      // mocks
      auth = TestBed.inject(AuthService) as SpyObj<AuthService>;
      authClient = TestBed.inject(
        AuthClientService
      ) as SpyObj<AuthClientService>;
      router = TestBed.inject(Router) as SpyObj<Router>;
      platform = TestBed.inject(Platform) as SpyObj<Platform>;
      appVersion = TestBed.inject(AppVersion) as SpyObj<AppVersion>;
      toastPresenter = TestBed.inject(
        ToastPresenterService
      ) as SpyObj<ToastPresenterService>;

      endpoint = TestBed.inject(EndpointService) as SpyObj<EndpointService>;
      endpoint.isCustomEndpoint.and.returnValue(false);
      endpoint.setEndpointForUser.and.returnValue(true);
      endpoint.setCustomEndpoint.and.returnValue(true);

      alertCtrl = TestBed.inject(AlertController) as SpyObj<AlertController>;
      alert = createSpyObj<HTMLIonAlertElement>([
        'present',
        'dismiss',
        'onDidDismiss',
      ]);
      alertCtrl.create.and.resolveTo(alert);
      alert.onDidDismiss.and.returnValue(
        new Promise((resolve) =>
          alert.dismiss.and.callFake((x) => {
            resolve({ data: x });
            return Promise.resolve(true);
          })
        )
      );

      loadingCtrl = TestBed.inject(
        LoadingController
      ) as SpyObj<LoadingController>;
      loadingCtrl.create.and.resolveTo(
        createSpyObj<HTMLIonLoadingElement>(['present', 'dismiss'])
      );
    })
  );
  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it(
    'should create',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it(
    'should login successfully set the user and navigate to home',
    waitForAsync(async () => {
      const response = createLoginResponse({ username });
      authClient.login.and.resolveTo(response);
      await component.login();
      expect(auth.handleLoginResponse).toHaveBeenCalledOnceWith(response);
      expect(router.navigate).toHaveBeenCalledOnceWith(['home']);
    })
  );

  it(
    'should not be able to login as a professional user',
    waitForAsync(async () => {
      const response = createLoginResponse({
        username: 'TEST-Forscher',
        role: 'Forscher',
      });
      authClient.login.and.resolveTo(response);
      await component.login();
      expect(toastPresenter.presentToast).toHaveBeenCalledOnceWith(
        'LOGIN.TOAST_MSG_ONLY_PROBANDS_ALLOWED'
      );
      expect(auth.handleLoginResponse).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    })
  );

  it(
    'should handle an error on login',
    waitForAsync(async () => {
      // Arrange
      const response: HttpErrorResponse = new HttpErrorResponse({
        error: {
          statusCode: 403,
          details: {
            remainingTime: 200,
          },
        },
        status: 403,
      });
      authClient.login.and.rejectWith(response);

      // Act
      jasmine.clock().install();
      await component.login();
      expect(component.form.get('password').disabled).toBeTrue();
      jasmine.clock().tick(response.error.details.remainingTime * 1000);
      expect(component.form.get('password').disabled).toBeFalse();
      jasmine.clock().uninstall();

      // Assert
      expect(auth.handleLoginResponse).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    })
  );

  it(
    'should request a new password',
    waitForAsync(async () => {
      // Arrange
      authClient.requestNewPassword.and.resolveTo();

      // Act 1
      await component.showRequestPWDialog();
      expect(alertCtrl.create).toHaveBeenCalledTimes(1);

      // Assert 1
      const yesButton = alertCtrl.create.calls.first().args[0]
        .buttons[1] as AlertButton;
      expect(yesButton.text).toEqual('GENERAL.YES');

      // Act 2
      yesButton.handler(null);

      // Assert 2
      expect(alert.dismiss).toHaveBeenCalledOnceWith(true);
      await fixture.whenStable();
      expect(authClient.requestNewPassword).toHaveBeenCalledOnceWith(username);
      await fixture.whenStable();
      expect(toastPresenter.presentToast).toHaveBeenCalledOnceWith(
        'LOGIN.TOAST_MSG_NEW_PASSWORD_RESULT'
      );
    })
  );

  it(
    'should not request a new password if clicked on NO',
    waitForAsync(async () => {
      // Act 1
      await component.showRequestPWDialog();
      expect(alertCtrl.create).toHaveBeenCalledTimes(1);

      // Assert 1
      const noButton = alertCtrl.create.calls.first().args[0]
        .buttons[0] as AlertButton;
      expect(noButton.text).toEqual('GENERAL.NO');

      // Act 2
      noButton.handler(null);

      // Assert 2
      expect(alert.dismiss).toHaveBeenCalledOnceWith(false);
      expect(authClient.requestNewPassword).not.toHaveBeenCalled();
    })
  );
});
