/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import { RemarkDialogComponent } from './remark-dialog.component';

describe('RemarkDialogComponent', () => {
  let fixture: MockedComponentFixture;
  let component: RemarkDialogComponent;

  beforeEach(async () => {
    // Build Base Module
    await MockBuilder(RemarkDialogComponent, [AppModule, MAT_DIALOG_DATA]).mock(
      MAT_DIALOG_DATA,
      {
        remark: 'some remark',
      }
    );
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(RemarkDialogComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should be created', () => {
    expect(component).toBeDefined();
  });
});
