import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController } from '@ionic/angular';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { ChangePasswordPage } from './change-password.page';
import { AuthClientService } from '../auth-client.service';
import { AuthService } from '../auth.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';

describe('ChangePasswordPage', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;

  let authClient: SpyObj<AuthClientService>;
  let auth: SpyObj<AuthService>;
  let toastPresenter: SpyObj<ToastPresenterService>;
  let translate: SpyObj<TranslateService>;
  let loadingCtrl: SpyObj<LoadingController>;
  let router: SpyObj<Router>;
  let activatedRoute;

  beforeEach(() => {
    authClient = jasmine.createSpyObj('AuthClientService', [
      'changePassword',
      'logout',
    ]);
    auth = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'resetCurrentUser',
      'setPasswordNeeded',
    ]);
    toastPresenter = jasmine.createSpyObj('ToastPresenterService', [
      'presentToast',
    ]);
    translate = jasmine.createSpyObj('TranslateService', ['intent']);
    loadingCtrl = jasmine.createSpyObj('LoadingController', ['create']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      snapshot: { queryParamMap: convertToParamMap({ isUserIntent: 'true' }) },
    };

    TestBed.configureTestingModule({
      declarations: [ChangePasswordPage, MockPipe(TranslatePipe)],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthClientService, useValue: authClient },
        { provide: AuthService, useValue: auth },
        { provide: ToastPresenterService, useValue: toastPresenter },
        { provide: TranslateService, useValue: translate },
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
