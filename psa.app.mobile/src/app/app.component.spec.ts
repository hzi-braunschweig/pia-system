/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { BehaviorSubject, NEVER } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { User } from './auth/auth.model';
import { AppModule } from './app.module';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslatePipe } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

describe('AppComponent', () => {
  let statusBarSpy: SpyObj<StatusBar>;
  let splashScreenSpy: SpyObj<SplashScreen>;
  let platformSpy: SpyObj<Platform>;
  let auth: SpyObj<AuthService>;
  let compliance: SpyObj<ComplianceService>;
  let notification: SpyObj<NotificationService>;
  let currentUser$: BehaviorSubject<User>;
  const currentUser: User = {
    username: 'TESTUSER-1234',
    role: 'Proband',
    study: 'teststudy',
  };

  beforeEach(async () => {
    statusBarSpy = jasmine.createSpyObj<StatusBar>('StatusBar', [
      'styleDefault',
    ]);
    splashScreenSpy = jasmine.createSpyObj<SplashScreen>('SplashScreen', [
      'hide',
    ]);
    platformSpy = jasmine.createSpyObj<Platform>('Platform', ['ready', 'is']);
    currentUser$ = new BehaviorSubject<User>(currentUser);
    auth = jasmine.createSpyObj(
      'AuthService',
      ['getCurrentUser', 'isAuthenticated'],
      {
        currentUser$,
      }
    );
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

    platformSpy.ready.and.resolveTo();
    compliance.userHasCompliances.and.resolveTo(true);
    compliance.isInternalComplianceActive.and.resolveTo(true);
    auth.isAuthenticated.and.returnValue(true);
    auth.getCurrentUser.and.returnValue(currentUser);

    await MockBuilder(AppComponent, AppModule)
      .mock(AuthService, auth)
      .mock(ComplianceService, compliance)
      .mock(NotificationService, notification)
      .mock(StatusBar, statusBarSpy)
      .mock(SplashScreen, splashScreenSpy)
      .mock(Platform, platformSpy)
      .mock(Platform, platformSpy)
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
    expect(statusBarSpy.styleDefault).toHaveBeenCalled();
    expect(splashScreenSpy.hide).toHaveBeenCalled();
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
    expect(menuItems.length).toEqual(6);
    expect(menuItems[0].textContent).toContain('APP.MENU.HOME');
    expect(menuItems[1].textContent).toContain('APP.MENU.QUESTIONNAIRES');
    expect(menuItems[2].textContent).toContain('APP.MENU.LAB_RESULTS');
    expect(menuItems[3].textContent).toContain('APP.MENU.COMPLIANCES');
    expect(menuItems[4].textContent).toContain('APP.MENU.SETTINGS');
    expect(menuItems[5].textContent).toContain('APP.MENU.CONTACT');
  }));

  it('should have urls', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    tick();
    fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('#menu-content ion-item');
    expect(menuItems.length).toEqual(6);
    expect(menuItems[0].getAttribute('ng-reflect-router-link')).toEqual(
      '/home'
    );
    expect(menuItems[1].getAttribute('ng-reflect-router-link')).toEqual(
      '/questionnaire'
    );
    expect(menuItems[2].getAttribute('ng-reflect-router-link')).toEqual(
      '/lab-result'
    );
    expect(menuItems[3].getAttribute('ng-reflect-router-link')).toEqual(
      '/compliance'
    );
    expect(menuItems[4].getAttribute('ng-reflect-router-link')).toEqual(
      '/settings'
    );
    expect(menuItems[5].getAttribute('ng-reflect-router-link')).toEqual(
      '/contact'
    );
  }));
});
