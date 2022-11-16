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
import { User } from '../../../auth/auth.model';
import { AccountClientService } from '../../services/account-client.service';
import {
  AlertController,
  IonicModule,
  LoadingController,
} from '@ionic/angular';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';
import { DeletionType } from '../../services/deletion-type.enum';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  TranslateModule,
  TranslatePipe,
  TranslateService,
} from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockPipe } from 'ng-mocks';
import { AlertButton } from '@ionic/core/dist/types/components/alert/alert-interface';
import SpyObj = jasmine.SpyObj;

describe('DeleteAccountModalComponent', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;
  let authService: SpyObj<AuthService>;
  let accountClientService: AccountClientService;
  let deleteAccountModalService: DeleteAccountModalService;
  let alertCtrl: SpyObj<AlertController>;
  let loadingCtrl: SpyObj<LoadingController>;
  let alertOkHandler: (value) => void;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser',
      'logout',
    ]);
    authService.logout.and.resolveTo();

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

    await TestBed.configureTestingModule({
      declarations: [DeleteAccountModalComponent, MockPipe(TranslatePipe)],
      imports: [HttpClientTestingModule, IonicModule, TranslateModule],
      providers: [
        {
          provide: TranslateService,
          useValue: translate,
        },
        {
          provide: AlertController,
          useValue: alertCtrl,
        },
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: AuthService, useValue: authService },
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
      authService.getCurrentUser.and.returnValue({
        username: expectedUsername,
      } as User);

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

      expect(authService.logout).toHaveBeenCalledTimes(1);
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
