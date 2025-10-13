/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { NEVER } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { AppModule } from './app.module';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from './auth/current-user.service';

describe('AppComponent', () => {
  let platformSpy: SpyObj<Platform>;
  let auth: SpyObj<AuthService>;
  let compliance: SpyObj<ComplianceService>;
  let notification: SpyObj<NotificationService>;
  let alertCtrl: SpyObj<AlertController>;
  let loadingCtrl: SpyObj<LoadingController>;
  let currentUser: SpyObj<CurrentUser>;
  let alertOkHandler: (value) => void;

  beforeEach(async () => {
    spyOn(StatusBar, 'setOverlaysWebView');
    spyOn(StatusBar, 'setStyle');
    spyOn(StatusBar, 'setBackgroundColor');
    spyOn(SplashScreen, 'hide');

    platformSpy = jasmine.createSpyObj<Platform>('Platform', ['ready', 'is']);
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout'], {
      isAuthenticated$: NEVER,
    });
    compliance = jasmine.createSpyObj(
      'ComplianceService',
      ['userHasCompliances', 'isInternalComplianceActive'],
      {
        complianceDataChangesObservable: NEVER,
      }
    );
    notification = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['initPushNotifications']
    );

    alertCtrl = jasmine.createSpyObj<AlertController>('AlertController', [
      'create',
    ]);
    alertCtrl.create.and.callFake((config) => {
      alertOkHandler = (
        config.buttons
          .filter((button) => typeof button !== 'string')
          .find((button: AlertButton) => button.handler) as AlertButton
      ).handler;

      return Promise.resolve({
        present: () => Promise.resolve(),
        dismiss: () => Promise.resolve(),
      } as unknown as HTMLIonAlertElement);
    });

    loadingCtrl = jasmine.createSpyObj<LoadingController>('LoadingController', [
      'create',
    ]);
    loadingCtrl.create.and.callFake(() => {
      return Promise.resolve({
        present: () => Promise.resolve(),
        dismiss: () => Promise.resolve(),
      } as unknown as HTMLIonLoadingElement);
    });

    currentUser = jasmine.createSpyObj<CurrentUser>('CurrentUser', [], {
      username: 'TESTUSER-1234',
      study: 'teststudy',
    });

    platformSpy.ready.and.resolveTo();
    compliance.userHasCompliances.and.resolveTo(true);
    compliance.isInternalComplianceActive.and.resolveTo(true);
    auth.isAuthenticated.and.returnValue(true);
    auth.logout.and.resolveTo();

    await MockBuilder(AppComponent, AppModule)
      .mock(AuthService, auth)
      .mock(ComplianceService, compliance)
      .mock(NotificationService, notification)
      .mock(Platform, platformSpy)
      .mock(Platform, platformSpy)
      .mock(AlertController, alertCtrl)
      .mock(LoadingController, loadingCtrl)
      .mock(CurrentUser, currentUser)
      .mock(TranslatePipe, (value) => value);
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app', fakeAsync(() => {
    platformSpy.is.and.returnValue(true);
    TestBed.createComponent(AppComponent);
    expect(platformSpy.ready).toHaveBeenCalled();
    tick();
    expect(StatusBar.setOverlaysWebView).toHaveBeenCalledOnceWith({
      overlay: false,
    });
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Light });
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({
      color: '#599118',
    });
    expect(SplashScreen.hide).toHaveBeenCalled();
  }));

  it('should initialize notifications when a user is logged in', fakeAsync(() => {
    TestBed.createComponent(AppComponent);
    tick();
    expect(notification.initPushNotifications).toHaveBeenCalled();
  }));

  it('should have menu labels', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    tick();
    fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('#menu-content ion-label');

    expect([...menuItems].map((item) => item.innerText)).toEqual([
      'APP.MENU.HOME',
      'APP.MENU.QUESTIONNAIRES',
      'APP.MENU.STATISTICS',
      'APP.MENU.LAB_RESULTS',
      'APP.MENU.COMPLIANCES',
      'APP.MENU.SETTINGS',
      'APP.MENU.CONTACT',
    ]);
  }));

  it('should have urls', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    tick();
    fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems: any[] = app.querySelectorAll('#menu-content ion-item');

    expect(
      [...menuItems].map((item) => item.getAttribute('ng-reflect-router-link'))
    ).toEqual([
      '/home',
      '/questionnaire',
      '/feedback-statistics',
      '/lab-result',
      '/compliance',
      '/settings',
      '/contact',
    ]);
  }));

  describe('onLogout()', () => {
    beforeEach(fakeAsync(() => {
      const fixture = TestBed.createComponent(AppComponent);
      tick();
      fixture.detectChanges();

      fixture.componentInstance.logout();
    }));

    it('should present a confirm alert on logout', () => {
      expect(alertCtrl.create).toHaveBeenCalledTimes(1);
    });

    it('should logout on ok click', fakeAsync(() => {
      expect(alertOkHandler).toBeDefined();

      alertOkHandler(null);
      tick();

      expect(auth.logout).toHaveBeenCalledTimes(1);
    }));
  });
});
