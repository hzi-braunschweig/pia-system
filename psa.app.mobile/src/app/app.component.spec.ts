/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  fakeAsync,
  TestBed,
  tick,
  flush,
  ComponentFixture,
} from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import {
  AlertController,
  LoadingController,
  Platform,
  NavController,
  IonApp,
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonIcon,
  IonFooter,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { TranslateModule } from '@ngx-translate/core';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from './auth/current-user.service';
import { SideMenuService } from './shared/services/side-menu/side-menu.service';
import { signal } from '@angular/core';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { Component } from '@angular/core';

describe('AppComponent', () => {
  let platformSpy: SpyObj<Platform>;
  let auth: SpyObj<AuthService>;
  let compliance: SpyObj<ComplianceService>;
  let notification: SpyObj<NotificationService>;
  let alertCtrl: SpyObj<AlertController>;
  let sideMenu: SpyObj<SideMenuService>;
  let loadingCtrl: SpyObj<LoadingController>;
  let currentUser: SpyObj<CurrentUser>;
  let alertOkHandler: (value) => void;
  let activatedRoute: SpyObj<ActivatedRoute>;
  let navController: SpyObj<NavController>;
  let location: SpyObj<Location>;

  beforeEach(async () => {
    spyOn(SplashScreen, 'hide');

    activatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {} },
      params: NEVER,
      queryParams: NEVER,
    });
    navController = jasmine.createSpyObj('NavController', [
      'navigateForward',
      'navigateBack',
    ]);
    location = jasmine.createSpyObj('Location', ['back', 'forward'], {
      path: () => '/',
      subscribe: () => of(),
    });

    platformSpy = jasmine.createSpyObj<Platform>('Platform', ['ready', 'is']);
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout']);
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
    platformSpy.is.and.returnValue(true);

    compliance.userHasCompliances.and.resolveTo(true);
    compliance.isInternalComplianceActive.and.resolveTo(true);
    auth.isAuthenticated.and.returnValue(true);
    auth.logout.and.resolveTo();

    sideMenu = jasmine.createSpyObj<SideMenuService>('SideMenuService', [], {
      appPages: signal([
        {
          title: 'APP.MENU.HOME',
          url: '/home',
          icon: 'home',
          isShown: true,
        },
        {
          title: 'APP.MENU.QUESTIONNAIRES',
          url: '/questionnaire',
          icon: 'list',
          isShown: true,
        },
      ]),
    });

    TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ComplianceService, useValue: compliance },
        { provide: NotificationService, useValue: notification },
        { provide: Platform, useValue: platformSpy },
        { provide: AlertController, useValue: alertCtrl },
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: CurrentUser, useValue: currentUser },
        { provide: SideMenuService, useValue: sideMenu },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NavController, useValue: navController },
        { provide: Location, useValue: location },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    });

    // Static override: strip ion-router-outlet to prevent chunk loading errors during tests
    TestBed.overrideComponent(AppComponent, {
      set: {
        template: `
<ion-app>
  <ion-menu contentId="main-content">
    <ion-content id="menu-content">
      <ion-list>
        <ion-menu-toggle *ngFor="let p of sideMenu.appPages()" autoHide="false">
          <ion-item [routerLink]="p.url" routerDirection="root">
            <ion-label>{{ p.title }}</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>
    <ion-footer>
      <ion-item (click)="logout()">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        <ion-label>GENERAL.LOGOUT</ion-label>
      </ion-item>
    </ion-footer>
  </ion-menu>
  <div id="main-content"></div>
</ion-app>
        `,
      },
    });

    await TestBed.compileComponents();
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
    expect(SplashScreen.hide).toHaveBeenCalled();
  }));

  it('should have menu labels', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    tick();
    fixture.detectChanges();
    flush();

    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('#menu-content ion-label');
    expect([...menuItems].map((item) => item.textContent)).toEqual([
      'APP.MENU.HOME',
      'APP.MENU.QUESTIONNAIRES',
    ]);
  }));

  it('should have urls', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    tick();
    fixture.detectChanges();
    flush();

    const app = fixture.nativeElement;
    const menuItems: any[] = app.querySelectorAll('#menu-content ion-item');

    expect(
      [...menuItems].map((item) => item.getAttribute('ng-reflect-router-link'))
    ).toEqual(['/home', '/questionnaire']);
  }));

  describe('onLogout()', () => {
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(AppComponent);
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
