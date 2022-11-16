/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySelectComponent } from './study-select.component';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrentUser } from '../../_services/current-user.service';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSelectModule } from '@angular/material/select';
import { MockPipe, MockProvider } from 'ng-mocks';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslatePipe } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-test-study-select',
  template: `<app-study-select
    [required]="true"
    [formControl]="control"
  ></app-study-select>`,
})
class TestStudySelectComponent {
  public control = new FormControl<string | null>(null);
}

describe('StudySelectComponent', () => {
  let component: TestStudySelectComponent;
  let fixture: ComponentFixture<TestStudySelectComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {});

  describe('multiple studies', () => {
    beforeEach(() =>
      createComponent(['Teststudy1', 'Teststudy2', 'Teststudy3'])
    );

    it('should present all studies a user has access to', async () => {
      const select = await loader.getHarness(MatSelectHarness);
      await select.open();
      const options = await select.getOptions();
      const optionTexts: string[] = await Promise.all(
        options.map((option) => option.getText())
      );
      expect(options.length).toEqual(3);
      expect(optionTexts).toEqual(['Teststudy1', 'Teststudy2', 'Teststudy3']);
    });

    it('should set value from outside', async () => {
      const select = await loader.getHarness(MatSelectHarness);
      expect(await select.getValueText()).toEqual('');
      component.control.setValue('Teststudy2');
      expect(await select.getValueText()).toEqual('Teststudy2');
    });
  });

  describe('single study', () => {
    beforeEach(() => createComponent(['Teststudy']));

    it('should preselect single study', async () => {
      const select = await loader.getHarness(MatSelectHarness);
      expect(await select.getValueText()).toEqual('Teststudy');
    });
  });

  async function createComponent(studies: string[]) {
    let currentUser = jasmine.createSpyObj('CurrentUser', [], {
      studies,
    });

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
      ],
      declarations: [
        StudySelectComponent,
        TestStudySelectComponent,
        MockPipe(TranslatePipe, (value) => value),
      ],
      providers: [MockProvider(CurrentUser, currentUser)],
    }).compileComponents();

    fixture = TestBed.createComponent(TestStudySelectComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  }
});
