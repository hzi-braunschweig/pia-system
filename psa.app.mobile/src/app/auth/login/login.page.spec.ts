/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AlertController,
  IonicModule,
  LoadingController,
  MenuController,
  Platform,
} from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { LoginPage } from './login.page';
import { LocaleService } from '../../shared/services/locale/locale.service';
import { AuthService } from '../auth.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';
import { AuthClientService } from '../auth-client.service';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  let localeService: SpyObj<LocaleService>;
  let platform: SpyObj<Platform>;
  let loadingCtrl: SpyObj<LoadingController>;
  let authClient: SpyObj<AuthClientService>;
  let auth: SpyObj<AuthService>;
  let router: SpyObj<Router>;
  let menuCtrl: SpyObj<MenuController>;
  let toastPresenter: SpyObj<ToastPresenterService>;
  let alertCtrl: SpyObj<AlertController>;
  let translate: SpyObj<TranslateService>;
  let endpoint: SpyObj<EndpointService>;
  let activatedRoute;

  beforeEach(() => {
    localeService = jasmine.createSpyObj('LocaleService', ['currentLocale']);
    platform = jasmine.createSpyObj('Platform', ['is']);
    loadingCtrl = jasmine.createSpyObj('LoadingController', ['create']);
    authClient = jasmine.createSpyObj('AuthClientService', [
      'login',
      'loginWithToken',
    ]);
    auth = jasmine.createSpyObj('AuthService', ['emitLogin']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    menuCtrl = jasmine.createSpyObj('MenuController', ['enable']);
    toastPresenter = jasmine.createSpyObj('ToastPresenterService', [
      'presentToast',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    endpoint = jasmine.createSpyObj('EndpointService', ['isCustomEndpoint']);
    activatedRoute = {
      snapshot: {
        queryParamMap: jasmine.createSpyObj('ActivatedRouteSnapshot', ['get']),
      },
    };

    TestBed.configureTestingModule({
      declarations: [LoginPage, MockPipe(TranslatePipe)],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: LocaleService, useValue: localeService },
        { provide: Platform, useValue: platform },
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: AuthClientService, useValue: authClient },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: MenuController, useValue: menuCtrl },
        { provide: ToastPresenterService, useValue: toastPresenter },
        { provide: AlertController, useValue: alertCtrl },
        { provide: TranslateService, useValue: translate },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: EndpointService, useValue: endpoint },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
