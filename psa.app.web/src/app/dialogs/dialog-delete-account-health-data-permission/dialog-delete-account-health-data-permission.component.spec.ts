/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDeleteAccountHealthDataPermissionComponent } from './dialog-delete-account-health-data-permission.component';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslatePipe } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('DeleteAccountHealthDataPermissionDialogComponent', () => {
  let component: DialogDeleteAccountHealthDataPermissionComponent;
  let fixture: ComponentFixture<DialogDeleteAccountHealthDataPermissionComponent>;

  beforeEach(async () => {
    await MockBuilder(
      DialogDeleteAccountHealthDataPermissionComponent,
      AppModule
    ).mock(TranslatePipe, (value) => value);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      DialogDeleteAccountHealthDataPermissionComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ask for permission to keep health data', () => {
    const questionText = fixture.debugElement.query(
      By.css('[data-unit="keep-health-data-question"]')
    );
    expect(questionText).not.toBeNull();
    expect(questionText.nativeElement.innerText).toEqual(
      'SETTINGS.DELETE_ACCOUNT_BUT_KEEP_HEALTH_DATA_QUESTION'
    );
  });
});
