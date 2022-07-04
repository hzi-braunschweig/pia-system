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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MockBuilder } from 'ng-mocks';
import { Subject } from 'rxjs';

import { AppModule } from '../../app.module';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { AlertService } from '../../_services/alert.service';
import SpyObj = jasmine.SpyObj;
import { By } from '@angular/platform-browser';
import { DialogDeleteAccountHealthDataPermissionComponent } from '../../dialogs/dialog-delete-account-health-data-permission/dialog-delete-account-health-data-permission.component';
import { DialogDeleteAccountConfirmationComponent } from '../../dialogs/dialog-delete-account-confirmation/dialog-delete-account-confirmation.component';
import { DialogDeleteAccountSuccessComponent } from '../../dialogs/dialog-delete-account-success/dialog-delete-account-success.component';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let dialog: SpyObj<MatDialog>;
  let authService: SpyObj<AuthService>;
  let authManager: SpyObj<AuthenticationManager>;
  let alertService: SpyObj<AlertService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let dialogAfterClosed: Subject<string>;

  beforeEach(async () => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialogAfterClosed = new Subject();
    dialog.open.and.returnValue({
      afterClosed: () => dialogAfterClosed.asObservable(),
    } as MatDialogRef<SettingsComponent>);

    authService = jasmine.createSpyObj('AuthService', ['deleteProbandAccount']);

    authManager = jasmine.createSpyObj('AuthenticationManager', [
      'getCurrentUsername',
      'getCurrentStudy',
    ]);
    authManager.getCurrentUsername.and.returnValue('TestProband');
    authManager.getCurrentStudy.and.returnValue('TestStudy');

    alertService = jasmine.createSpyObj('AlertService', ['errorMessage']);

    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getStudy',
    ]);
    questionnaireService.getStudy.and.resolveTo(
      createStudy({ has_partial_opposition: true })
    );

    await MockBuilder(SettingsComponent, AppModule)
      .mock(MatDialog, dialog)
      .mock(AuthService, authService)
      .mock(AuthenticationManager, authManager)
      .mock(AlertService, alertService)
      .mock(QuestionnaireService, questionnaireService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('account deletion', () => {
    it('should initiate accout deletion with request for health data permission', fakeAsync(() => {
      clickDeleteAccountButton();
      expect(dialog.open).toHaveBeenCalledWith(
        DialogDeleteAccountHealthDataPermissionComponent,
        {
          width: '500px',
        }
      );
    }));

    it('should skip request for health data permission if study has no partial opposition', fakeAsync(() => {
      questionnaireService.getStudy.and.resolveTo(
        createStudy({ has_partial_opposition: false })
      );
      clickDeleteAccountButton();
      expect(dialog.open).toHaveBeenCalledWith(
        DialogDeleteAccountConfirmationComponent,
        {
          width: '500px',
          data: false,
        }
      );
    }));

    it('should show confirm dialog for full deletion', fakeAsync(() => {
      clickDeleteAccountButton();
      dialogAfterClosed.next('disagree');
      tick();

      expect(dialog.open).toHaveBeenCalledWith(
        DialogDeleteAccountConfirmationComponent,
        {
          width: '500px',
          data: false,
        }
      );
    }));

    it('should show confirm dialog for full deletion', fakeAsync(() => {
      clickDeleteAccountButton();
      dialogAfterClosed.next('agree');
      tick();

      expect(dialog.open).toHaveBeenCalledWith(
        DialogDeleteAccountConfirmationComponent,
        {
          width: '500px',
          data: true,
        }
      );
    }));

    it('should delete account if it was confirmed', fakeAsync(() => {
      clickDeleteAccountButton();
      dialogAfterClosed.next('agree');
      tick();
      dialogAfterClosed.next('delete');
      tick();

      expect(authService.deleteProbandAccount).toHaveBeenCalledOnceWith(
        'TestProband',
        'contact'
      );
    }));

    it('should show a success dialog if deletion was successful', fakeAsync(() => {
      clickDeleteAccountButton();
      authService.deleteProbandAccount.and.resolveTo();
      dialogAfterClosed.next('agree');
      tick();
      dialogAfterClosed.next('delete');
      tick();

      expect(dialog.open).toHaveBeenCalledWith(
        DialogDeleteAccountSuccessComponent,
        {
          width: '500px',
          disableClose: true,
        }
      );
    }));

    it('should show an error alert if deletion was not successful', fakeAsync(() => {
      clickDeleteAccountButton();
      authService.deleteProbandAccount.and.rejectWith('some error');
      dialogAfterClosed.next('agree');
      tick();
      dialogAfterClosed.next('delete');
      tick();

      expect(alertService.errorMessage).toHaveBeenCalledOnceWith(
        'SETTINGS.ACCOUNT_DELETION_FAILED'
      );
    }));
  });

  function clickDeleteAccountButton(): void {
    const deleteButton = fixture.debugElement.query(
      By.css('[data-unit="delete-account-button"]')
    );
    deleteButton.nativeElement.click();
    fixture.detectChanges();
    tick();
  }
});
