import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockComponent, MockPipe } from 'ng-mocks';

import { ContactPage } from './contact.page';
import { AuthService } from '../auth/auth.service';
import { ContactClientService } from './contact-client.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { User } from '../auth/auth.model';
import { HeaderComponent } from '../shared/components/header/header.component';
import { MaterialClientService } from './material-client.service';
import SpyObj = jasmine.SpyObj;

describe('ContactPage', () => {
  let component: ContactPage;
  let fixture: ComponentFixture<ContactPage>;

  let auth: SpyObj<AuthService>;
  let contactClient: SpyObj<ContactClientService>;
  let materialClient: SpyObj<MaterialClientService>;
  let alertCtrl: SpyObj<AlertController>;
  let translate: SpyObj<TranslateService>;
  let toastPresenter: SpyObj<ToastPresenterService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    contactClient = jasmine.createSpyObj('ContactClientService', [
      'getStudyAddresses',
    ]);
    materialClient = jasmine.createSpyObj('MaterialClientService', [
      'requestMaterial',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    toastPresenter = jasmine.createSpyObj('ToastPresenterService', [
      'presentToast',
    ]);

    auth.getCurrentUser.and.returnValue({
      username: 'Testuser',
      role: 'Proband',
    } as User);

    TestBed.configureTestingModule({
      declarations: [
        ContactPage,
        MockPipe(TranslatePipe),
        MockComponent(HeaderComponent),
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ContactClientService, useValue: contactClient },
        { provide: MaterialClientService, useValue: materialClient },
        { provide: AlertController, useValue: alertCtrl },
        { provide: TranslateService, useValue: translate },
        { provide: ToastPresenterService, useValue: toastPresenter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
