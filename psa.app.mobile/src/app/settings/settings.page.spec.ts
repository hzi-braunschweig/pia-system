import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MockComponent, MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { SettingsPage } from './settings.page';
import { SettingsClientService } from './settings-client.service';
import { AuthService } from '../auth/auth.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { HeaderComponent } from '../shared/components/header/header.component';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;

  let settingsClient: SpyObj<SettingsClientService>;
  let auth: SpyObj<AuthService>;
  let toastPresenter: SpyObj<ToastPresenterService>;

  beforeEach(() => {
    settingsClient = jasmine.createSpyObj('SettingsClientService', [
      'getUserSettings',
      'putUserSettings',
    ]);
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    toastPresenter = jasmine.createSpyObj('ToastPresenterService', [
      'presentToast',
    ]);

    TestBed.configureTestingModule({
      declarations: [
        SettingsPage,
        MockPipe(TranslatePipe),
        MockComponent(HeaderComponent),
      ],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: SettingsClientService, useValue: settingsClient },
        { provide: AuthService, useValue: auth },
        { provide: ToastPresenterService, useValue: toastPresenter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
