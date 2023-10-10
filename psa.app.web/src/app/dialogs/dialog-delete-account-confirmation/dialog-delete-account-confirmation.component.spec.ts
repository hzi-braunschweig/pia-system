/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDeleteAccountConfirmationComponent } from './dialog-delete-account-confirmation.component';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { By } from '@angular/platform-browser';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslatePipe } from '@ngx-translate/core';

describe('DeleteAccountConfirmationDialogComponent', () => {
  let component: DialogDeleteAccountConfirmationComponent;
  let fixture: ComponentFixture<DialogDeleteAccountConfirmationComponent>;

  beforeEach(async () => {
    await MockBuilder(DialogDeleteAccountConfirmationComponent, [
      AppModule,
      MAT_DIALOG_DATA,
    ])
      .mock(MAT_DIALOG_DATA, true)
      .mock(TranslatePipe, (value) => value);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDeleteAccountConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ask for the final account deletion confirmation', () => {
    const confirmationText = fixture.debugElement.query(
      By.css('[data-unit="confirmation-text"]')
    );
    expect(confirmationText).not.toBeNull();
    expect(confirmationText.nativeElement.innerText).toEqual(
      'SETTINGS.CONFIRM_ACCOUNT_DELETION_KEEP_HEALTH_DATA'
    );
  });
});
