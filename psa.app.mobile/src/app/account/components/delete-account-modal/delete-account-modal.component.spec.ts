/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountModalComponent } from './delete-account-modal.component';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../auth/auth.model';
import { AccountClientService } from '../../services/account-client.service';
import { AlertController, IonicModule } from '@ionic/angular';
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

describe('DeleteAccountModalComponent', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;
  let authService: AuthService;
  let accountClientService: AccountClientService;
  let alertController: AlertController;
  let deleteAccountModalService: DeleteAccountModalService;

  beforeEach(async () => {
    const translate = jasmine.createSpyObj('TranslateService', ['get']);
    translate.get.and.returnValue(new BehaviorSubject('random string'));

    await TestBed.configureTestingModule({
      declarations: [DeleteAccountModalComponent, MockPipe(TranslatePipe)],
      imports: [HttpClientTestingModule, IonicModule, TranslateModule],
      providers: [
        {
          provide: TranslateService,
          useValue: translate,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    authService = TestBed.inject(AuthService);
    accountClientService = TestBed.inject(AccountClientService);
    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);
    alertController = TestBed.inject(AlertController);

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
    let logoutSpy: jasmine.Spy;
    let presentLogoutAlertSpy: jasmine.Spy;
    let presentErrorAlertSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(authService, 'getCurrentUser').and.returnValue({
        username: expectedUsername,
      } as User);

      deleteAccountSpy = spyOn(accountClientService, 'deleteAccount');

      logoutSpy = spyOn(authService, 'logout');
      dismissSpy = spyOn(component, 'dismiss');
      presentLogoutAlertSpy = spyOn<any>(component, 'presentLogoutAlert');
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
        expect(presentLogoutAlertSpy).toHaveBeenCalled();
      });
    });

    it('should show an error alert when deletion failed', async () => {
      const expectedDeletionType = DeletionType.FULL;

      spyOn(
        deleteAccountModalService,
        'getSelectedDeletionType'
      ).and.returnValue(expectedDeletionType);

      deleteAccountSpy.and.rejectWith();

      await component.delete();

      expect(deleteAccountSpy).toHaveBeenCalledOnceWith(
        expectedUsername,
        expectedDeletionType
      );
      expect(presentErrorAlertSpy).toHaveBeenCalled();
    });
  });
});
