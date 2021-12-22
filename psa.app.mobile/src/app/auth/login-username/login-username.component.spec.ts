/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoginUsernameComponent } from './login-username.component';
import {
  AlertController,
  IonicModule,
  LoadingController,
  Platform,
} from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { MockBuilder } from 'ng-mocks';
import { AuthModule } from '../auth.module';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import { Market } from '@ionic-native/market/ngx';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

function toggleCheckbox(fixture: ComponentFixture<LoginUsernameComponent>) {
  const valueBefore: boolean = fixture.componentInstance.form.value.rememberMe;
  const rememberCheckBox: HTMLIonCheckboxElement =
    fixture.nativeElement.querySelector('[data-unit="checkbox-remember-me"]');
  rememberCheckBox.checked = true;
  rememberCheckBox.dispatchEvent(new Event('ionChange'));
  fixture.detectChanges();
  expect(fixture.componentInstance.form.value.rememberMe).toEqual(!valueBefore);
}

function enterUsername(
  fixture: ComponentFixture<LoginUsernameComponent>,
  username: string
) {
  const usernameInput: HTMLIonInputElement =
    fixture.nativeElement.querySelector('[data-unit="input-username"]');
  usernameInput.value = username;
  usernameInput.dispatchEvent(new Event('ionChange'));
  fixture.detectChanges();
  expect(fixture.componentInstance.form.value.username).toEqual(username);
}

function clickNextButton(fixture: ComponentFixture<LoginUsernameComponent>) {
  const nextButton: HTMLIonButtonElement = fixture.nativeElement.querySelector(
    '[data-unit="next-button"]'
  );
  expect(nextButton.textContent).toContain('LOGIN.NEXT');
  expect(nextButton.disabled).toBeFalse();
  expect(fixture.componentInstance.form.valid).toBeTrue();
  nextButton.click(); // not causing to submit in tests, therefore:
  const formElement: HTMLFormElement =
    fixture.nativeElement.querySelector('form');
  formElement.dispatchEvent(new Event('ngSubmit'));
  fixture.detectChanges();
}

function clickShowUrlButton(fixture: ComponentFixture<LoginUsernameComponent>) {
  expect(
    fixture.componentInstance.form.get('customEndpointUrl').disabled
  ).toBeTrue();
  const showUrlButton: HTMLIonButtonElement =
    fixture.nativeElement.querySelector('[data-unit="button-url-show"]');
  showUrlButton.click();
  fixture.detectChanges();
  expect(
    fixture.componentInstance.form.get('customEndpointUrl').disabled
  ).toBeFalse();
}

function clickHideUrlButton(fixture: ComponentFixture<LoginUsernameComponent>) {
  expect(
    fixture.componentInstance.form.get('customEndpointUrl').disabled
  ).toBeFalse();
  const hideUrlButton: HTMLIonButtonElement =
    fixture.nativeElement.querySelector('[data-unit="button-url-hide"]');
  hideUrlButton.click();
  fixture.detectChanges();
  expect(
    fixture.componentInstance.form.get('customEndpointUrl').disabled
  ).toBeTrue();
}

function enterCustomEndpointUrl(
  fixture: ComponentFixture<LoginUsernameComponent>,
  url: string
) {
  const urlInput: HTMLIonInputElement = fixture.nativeElement.querySelector(
    '[data-unit="input-custom-url"]'
  );
  urlInput.value = url;
  urlInput.dispatchEvent(new Event('ionChange'));
  fixture.detectChanges();
  expect(fixture.componentInstance.form.value.customEndpointUrl).toEqual(url);
}

describe('LoginUsernameComponent', () => {
  let component: LoginUsernameComponent;
  let fixture: ComponentFixture<LoginUsernameComponent>;

  let auth: SpyObj<AuthService>;
  let platform: SpyObj<Platform>;
  let appVersion: SpyObj<AppVersion>;
  let market: SpyObj<Market>;
  let endpoint: SpyObj<EndpointService>;
  let alertCtrl: SpyObj<AlertController>;
  let loadingCtrl: SpyObj<LoadingController>;

  beforeEach(() =>
    MockBuilder(LoginUsernameComponent, AuthModule)
      .keep(IonicModule)
      .keep(ReactiveFormsModule)
      .mock(TranslatePipe, (x) => x)
      .mock(TranslateService, { instant: (x) => x })
      .mock(Platform)
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // mocks
      auth = TestBed.inject(AuthService) as SpyObj<AuthService>;
      platform = TestBed.inject(Platform) as SpyObj<Platform>;
      appVersion = TestBed.inject(AppVersion) as SpyObj<AppVersion>;
      market = TestBed.inject(Market) as SpyObj<Market>;

      endpoint = TestBed.inject(EndpointService) as SpyObj<EndpointService>;
      endpoint.isCustomEndpoint.and.returnValue(false);
      endpoint.setEndpointForUser.and.returnValue(true);
      endpoint.setCustomEndpoint.and.returnValue(true);

      alertCtrl = TestBed.inject(AlertController) as SpyObj<AlertController>;
      alertCtrl.create.and.resolveTo(
        createSpyObj<HTMLIonAlertElement>(['present', 'dismiss'])
      );

      loadingCtrl = TestBed.inject(
        LoadingController
      ) as SpyObj<LoadingController>;
      loadingCtrl.create.and.resolveTo(
        createSpyObj<HTMLIonLoadingElement>(['present', 'dismiss'])
      );
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(
    'should create with a custom url and enable the url field',
    waitForAsync(() => {
      endpoint.isCustomEndpoint.and.returnValue(true);
      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.form.get('customEndpointUrl').enabled).toBeTrue();
    })
  );

  it(
    'should change the endpoint and send a event for a updated username on submit',
    waitForAsync(async () => {
      // Arrange
      const username = 'TEST-1234567890';

      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const submitSpy = spyOn(component, 'onSubmit').and.callThrough();
      const usernameP = component.usernameChange.toPromise();

      // Act
      enterUsername(fixture, username);
      clickNextButton(fixture);
      await fixture.whenStable();

      // Assert
      expect(submitSpy).toHaveBeenCalledTimes(1);
      expect(await usernameP).toEqual('TEST-1234567890');
      expect(endpoint.setEndpointForUser).toHaveBeenCalledTimes(1);
    })
  );

  it(
    'should save the username on submit if remember checkbox was clicked',
    waitForAsync(async () => {
      // Arrange
      const username = 'TEST-1234567890';

      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Act
      enterUsername(fixture, username);
      toggleCheckbox(fixture);
      clickNextButton(fixture);
      await fixture.whenStable();

      // Assert
      expect(auth.setRememberedUsername).toHaveBeenCalledOnceWith(username);
    })
  );

  it(
    'should set a custom endpoint',
    waitForAsync(async () => {
      // Arrange
      const username = 'TEST-1234567890';
      const url = 'http://localhost/';

      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Act
      enterUsername(fixture, username);
      clickShowUrlButton(fixture);
      enterCustomEndpointUrl(fixture, url);
      clickNextButton(fixture);
      await fixture.whenStable();

      // Assert
      expect(endpoint.setCustomEndpoint).toHaveBeenCalledOnceWith(url);
      expect(endpoint.setEndpointForUser).not.toHaveBeenCalled();
    })
  );

  it(
    'should not set a custom endpoint if url is hidden again',
    waitForAsync(async () => {
      // Arrange
      const username = 'TEST-1234567890';
      const url = 'http://localhost/';

      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Act
      enterUsername(fixture, username);
      clickShowUrlButton(fixture);
      enterCustomEndpointUrl(fixture, url);
      clickHideUrlButton(fixture);
      clickNextButton(fixture);
      await fixture.whenStable();

      // Assert
      expect(endpoint.setCustomEndpoint).not.toHaveBeenCalled();
      expect(endpoint.setEndpointForUser).toHaveBeenCalledOnceWith(username);
    })
  );

  it(
    'should check if the app is compatible to the endpoint',
    waitForAsync(async () => {
      // Arrange
      const username = 'TEST-1234567890';

      fixture = TestBed.createComponent(LoginUsernameComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      platform.is.and.returnValue(true);
      appVersion.getVersionNumber.and.resolveTo('1.0.0');
      endpoint.isEndpointCompatible.and.resolveTo(false);
      component.usernameChange.subscribe(() => expect(true).toBeFalse());

      // Act
      enterUsername(fixture, username);
      clickNextButton(fixture);
      await fixture.whenStable();

      // Assert
      expect(alertCtrl.create).toHaveBeenCalledTimes(1);
      const goToStoreButton = alertCtrl.create.calls.first().args[0]
        .buttons[1] as AlertButton;
      expect(goToStoreButton.text).toEqual(
        'LOGIN.ALERT_BUTTON_LABEL_GO_TO_APP_STORE'
      );
      goToStoreButton.handler(null);
      expect(market.open).toHaveBeenCalled();
    })
  );
});
