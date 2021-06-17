import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AlertController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockPipe, MockProvider } from 'ng-mocks';
import { NEVER } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthClientService } from './auth/auth-client.service';
import { AuthService } from './auth/auth.service';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { User } from './auth/auth.model';
import { BadgeService } from './shared/services/badge/badge.service';
import SpyObj = jasmine.SpyObj;

describe('AppComponent', () => {
  let statusBarSpy;
  let splashScreenSpy;
  let platformReadySpy;
  let platformSpy;
  let auth: SpyObj<AuthService>;
  let compliance: SpyObj<ComplianceService>;

  beforeEach(() => {
    statusBarSpy = jasmine.createSpyObj('StatusBar', ['styleDefault']);
    splashScreenSpy = jasmine.createSpyObj('SplashScreen', ['hide']);
    platformReadySpy = Promise.resolve();
    platformSpy = jasmine.createSpyObj('Platform', { ready: platformReadySpy });
    auth = jasmine.createSpyObj('AuthService', [
      'getCurrentUser',
      'isAuthenticated',
    ]);
    compliance = jasmine.createSpyObj('ComplianceService', [
      'userHasCompliances',
      'isInternalComplianceActive',
    ]);

    (compliance as any).complianceDataChangesObservable = NEVER;
    compliance.userHasCompliances.and.resolveTo(true);
    compliance.isInternalComplianceActive.and.resolveTo(true);
    (auth as any).loggedIn = NEVER;
    auth.isAuthenticated.and.returnValue(true);
    auth.getCurrentUser.and.returnValue({ username: 'TESTUSER-1234' } as User);

    TestBed.configureTestingModule({
      declarations: [AppComponent, MockPipe(TranslatePipe, (value) => value)],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        MockProvider(AppVersion),
        MockProvider(StatusBar, statusBarSpy),
        MockProvider(SplashScreen, splashScreenSpy),
        MockProvider(Platform, platformSpy),
        MockProvider(AlertController),
        MockProvider(TranslateService),
        MockProvider(AuthClientService),
        MockProvider(ComplianceService, compliance),
        MockProvider(NotificationService),
        MockProvider(EndpointService),
        MockProvider(AuthService, auth),
        MockProvider(BadgeService),
      ],
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app', async () => {
    TestBed.createComponent(AppComponent);
    expect(platformSpy.ready).toHaveBeenCalled();
    await platformReadySpy;
    expect(statusBarSpy.styleDefault).toHaveBeenCalled();
    expect(splashScreenSpy.hide).toHaveBeenCalled();
  });

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
