/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { DeleteAccountModalComponent } from './delete-account-modal.component';
import { AuthService } from '../../../auth/auth.service';
import { AccountClientService } from '../../services/account-client.service';
import {
  AlertController,
  LoadingController,
  ModalController,
} from '@ionic/angular/standalone';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';
import { DeletionType } from '../../services/deletion-type.enum';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockProvider, MockModule } from 'ng-mocks';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../../../auth/current-user.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('DeleteAccountModalComponent', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;
  let auth: SpyObj<AuthService>;
  let accountClientService: AccountClientService;
  let deleteAccountModalService: DeleteAccountModalService;
  let alertCtrl: SpyObj<AlertController>;
  let loadingCtrl: SpyObj<LoadingController>;
  let currentUser: SpyObj<CurrentUser>;
  let alertOkHandler: (value) => void;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    auth.logout.and.resolveTo();

    const translate = jasmine.createSpyObj('TranslateService', [
      'get',
      'instant',
    ]);
    translate.get.and.returnValue(new BehaviorSubject('random string'));

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
      username: 'test-1',
    });

    await TestBed.configureTestingModule({
      imports: [MockModule(TranslateModule), DeleteAccountModalComponent],
      providers: [
        MockProvider(TranslateService, translate),
        MockProvider(AlertController, alertCtrl),
        MockProvider(LoadingController, loadingCtrl),
        MockProvider(ModalController),
        MockProvider(AuthService, auth),
        MockProvider(CurrentUser, currentUser),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    accountClientService = TestBed.inject(AccountClientService);
    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);

    spyOn(deleteAccountModalService, 'willDeleteAnswers').and.returnValue(true);

    fixture = TestBed.createComponent(DeleteAccountModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('delete an account', () => {
    const expectedUsername = 'test-1';
    let deleteAccountSpy: jasmine.Spy;
    let dismissSpy: jasmine.Spy;
    let presentErrorAlertSpy: jasmine.Spy;

    beforeEach(() => {
      deleteAccountSpy = spyOn(
        accountClientService,
        'deleteAccount'
      ).and.resolveTo();

      dismissSpy = spyOn(component, 'dismiss');
      presentErrorAlertSpy = spyOn<any>(component, 'presentErrorAlert');
    });

    [
      {
        expectation: 'contact',
        deletionType: DeletionType.CONTACT,
      },
      {
        expectation: 'everything',
        deletionType: DeletionType.FULL,
      },
    ].forEach(({ expectation, deletionType }) => {
      it(`should delete ${expectation} and present an alert on success`, async () => {
        spyOn(
          deleteAccountModalService,
          'getSelectedDeletionType'
        ).and.returnValue(deletionType);

        deleteAccountSpy.and.resolveTo();

        await component.delete();

        expect(deleteAccountSpy).toHaveBeenCalledOnceWith(
          expectedUsername,
          deletionType
        );
        expect(alertCtrl.create).toHaveBeenCalled();
      });
    });

    it('should logout on "back to login" button click', fakeAsync(() => {
      spyOn(
        deleteAccountModalService,
        'getSelectedDeletionType'
      ).and.returnValue(DeletionType.FULL);

      deleteAccountSpy.and.resolveTo();

      component.delete();
      tick();

      expect(alertOkHandler).toBeDefined();

      alertOkHandler(null);
      tick();

      expect(auth.logout).toHaveBeenCalledTimes(1);
    }));

    it('should show an error alert when deletion failed', fakeAsync(() => {
      const expectedDeletionType = DeletionType.FULL;

      spyOn(
        deleteAccountModalService,
        'getSelectedDeletionType'
      ).and.returnValue(expectedDeletionType);

      deleteAccountSpy.and.rejectWith();

      component.delete();
      tick();

      expect(deleteAccountSpy).toHaveBeenCalledOnceWith(
        expectedUsername,
        expectedDeletionType
      );
      expect(presentErrorAlertSpy).toHaveBeenCalled();
    }));
  });
});
