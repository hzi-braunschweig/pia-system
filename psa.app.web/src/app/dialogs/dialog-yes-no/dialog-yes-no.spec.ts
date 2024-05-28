/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatButtonModule } from '@angular/material/button';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { DialogYesNoComponent } from './dialog-yes-no';

describe('DialogYesNoComponent', () => {
  let fixture: ComponentFixture<DialogYesNoComponent>;
  let loader: HarnessLoader;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DialogYesNoComponent,
        MatDialogModule,
        MatButtonModule,
        MockModule(TranslateModule),
      ],
      providers: [MockProvider(MAT_DIALOG_DATA, { content: 'Are you sure?' })],
      declarations: [MockPipe(TranslatePipe, (value) => value)],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogYesNoComponent);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    dialog = TestBed.inject(MatDialog);
  });

  it('should show the passed content as title', async () => {
    dialog.open(DialogYesNoComponent, {
      data: { content: 'Are you sure?' },
    });
    const dialogHarness = await loader.getHarness(MatDialogHarness);

    expect(await dialogHarness.getTitleText()).toEqual('Are you sure?');

    await dialogHarness.close();
  });
});
