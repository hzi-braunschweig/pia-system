/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDeleteAccountSuccessComponent } from './dialog-delete-account-success.component';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('DialogDeleteAccountSuccessComponent', () => {
  let component: DialogDeleteAccountSuccessComponent;
  let fixture: ComponentFixture<DialogDeleteAccountSuccessComponent>;

  beforeEach(async () => {
    await MockBuilder(DialogDeleteAccountSuccessComponent, [
      AppModule,
      MAT_DIALOG_DATA,
    ])
      .mock(MAT_DIALOG_DATA, true)
      .mock(TranslatePipe, (value) => value);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDeleteAccountSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ask for the final account deletion confirmation', () => {
    const confirmationText = fixture.debugElement.query(
      By.css('[data-unit="success-text"]')
    );
    expect(confirmationText).not.toBeNull();
    expect(confirmationText.nativeElement.innerText).toEqual(
      'SETTINGS.ACCOUNT_DELETION_SUCCESS'
    );
  });
});
