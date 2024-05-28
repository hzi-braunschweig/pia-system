/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatErrorHarness } from '@angular/material/form-field/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MockModule, MockPipe, MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { DialogAddApiClientComponent } from './dialog-add-api-client.component';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { Study } from '../../psa.app.core/models/study';

describe('DialogAddApiClientComponent', () => {
  let fixture: ComponentFixture<DialogAddApiClientComponent>;
  let loader: HarnessLoader;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DialogAddApiClientComponent,
        NoopAnimationsModule,
        MockModule(TranslateModule),
        MatDialogModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      providers: [
        MockProvider(UserService, {
          getStudies$: () =>
            of([{ name: 'study1' }, { name: 'study2' }] as Study[]),
        }),
      ],
      declarations: [MockPipe(TranslatePipe, (value) => value)],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogAddApiClientComponent);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    dialog = TestBed.inject(MatDialog);
  });

  it('should show a short description', async () => {
    dialog.open(DialogAddApiClientComponent);

    const description = ngMocks.find('[data-unit="dialog-description"]');

    expect(description.nativeElement.innerText).toEqual(
      'PUBLIC_API.CLIENT_ADD_DIALOG_DESCRIPTION'
    );
  });

  it('should present available studies in select field', async () => {
    dialog.open(DialogAddApiClientComponent);
    await fixture.whenStable();
    const selectHarness = await loader.getHarness(MatSelectHarness);

    await selectHarness.open();

    const optionTexts = await Promise.all(
      (await selectHarness.getOptions()).map((option) => option.getText())
    );
    expect(optionTexts).toEqual(['study1', 'study2']);
  });

  it('should be required to enter a name', async () => {
    dialog.open(DialogAddApiClientComponent);
    const inputHarness = await loader.getHarness(MatInputHarness);
    const submitButtonHarness = await loader.getHarness(
      MatButtonHarness.with({
        text: 'PUBLIC_API.CLIENT_ADD_DIALOG_SUBMIT_BUTTON',
      })
    );

    let errorHarness = await loader.getHarnessOrNull(MatErrorHarness);
    expect(errorHarness).toBeNull();
    expect(await submitButtonHarness.isDisabled()).toBeTrue();

    await inputHarness.blur();

    errorHarness = await loader.getHarnessOrNull(MatErrorHarness);
    expect(await errorHarness.getText()).toEqual(
      'PUBLIC_API.CLIENT_ADD_NAME_INPUT_ERROR'
    );
    expect(await submitButtonHarness.isDisabled()).toBeTrue();
  });

  it('should be required to select at least one study', async () => {
    dialog.open(DialogAddApiClientComponent);
    const selectHarness = await loader.getHarness(MatSelectHarness);
    const submitButtonHarness = await loader.getHarness(
      MatButtonHarness.with({
        text: 'PUBLIC_API.CLIENT_ADD_DIALOG_SUBMIT_BUTTON',
      })
    );

    let errorHarness = await loader.getHarnessOrNull(MatErrorHarness);
    expect(errorHarness).toBeNull();
    expect(await submitButtonHarness.isDisabled()).toBeTrue();

    await selectHarness.blur();

    errorHarness = await loader.getHarnessOrNull(MatErrorHarness);
    expect(await errorHarness.getText()).toEqual(
      'PUBLIC_API.CLIENT_ADD_STUDIES_INPUT_ERROR'
    );
    expect(await submitButtonHarness.isDisabled()).toBeTrue();
  });

  it('should contain the entered name and selected studies', async () => {
    dialog.open(DialogAddApiClientComponent);
    const inputHarness = await loader.getHarness(MatInputHarness);
    const selectHarness = await loader.getHarness(MatSelectHarness);

    await inputHarness.setValue('test-client');
    await selectHarness.clickOptions({ text: 'study1' });

    expect(fixture.componentInstance.form.value).toEqual({
      name: 'test-client',
      studies: ['study1'],
    });
  });
});
