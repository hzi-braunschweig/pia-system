/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconModule } from '@angular/material/icon';
import { Pipe, PipeTransform } from '@angular/core';

import { FeedbackStatisticMetaDataComponent } from './feedback-statistic-meta-data.component';
import { FeedbackStatisticMetaDataFormService } from './feedback-statistic-meta-data-form.service';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent } from 'ng-mocks';
import { HintComponent } from '../../../features/hint/hint.component';
import { MarkdownEditorComponent } from '../../../features/markdown-editor/markdown-editor.component';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('FeedbackStatisticMetaDataComponent', () => {
  let component: FeedbackStatisticMetaDataComponent;
  let fixture: ComponentFixture<FeedbackStatisticMetaDataComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackStatisticMetaDataComponent, MockTranslatePipe],
      providers: [FeedbackStatisticMetaDataFormService],
      imports: [
        MatCardModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        NoopAnimationsModule,
        MockComponent(MarkdownEditorComponent),
        MockComponent(HintComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticMetaDataComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    component.study = 'Teststudy';
    fixture.detectChanges();
  });

  describe('form', () => {
    it('should allow title entry with maximum length of 80 chars', async () => {
      const input = await loader.getHarness(
        MatInputHarness.with({ selector: '[data-unit="title-input"]' })
      );
      await input.setValue('a'.repeat(80));
      expect(component.form.controls.title.value).toEqual('a'.repeat(80));

      await input.setValue('b'.repeat(81));
      expect(component.form.controls.title.hasError('maxlength')).toBeTrue();
    });

    it('should allow selection of visibility', async () => {
      const select = await loader.getHarness(
        MatSelectHarness.with({ selector: '[data-unit="visibility-select"]' })
      );
      await select.open();
      const options = await select.getOptions();
      const optionTexts: string[] = await Promise.all(
        options.map((option) => option.getText())
      );
      expect(options.length).toEqual(3);
      expect(optionTexts).toEqual([
        'FEEDBACK_STATISTICS.HIDDEN',
        'FEEDBACK_STATISTICS.TESTPROBANDS',
        'FEEDBACK_STATISTICS.ALLAUDIENCES',
      ]);
      await select.clickOptions({ text: 'FEEDBACK_STATISTICS.ALLAUDIENCES' });
      expect(component.form.controls.visibility.value).toEqual('allaudiences');
    });
  });

  describe('getConfiguration()', () => {
    it('should return the configuration dto', () => {
      component.form.patchValue({
        title: 'Testtitle',
        description: 'Testdescription',
        visibility: 'allaudiences',
      });

      const configuration = component.getConfiguration();

      expect(configuration).toEqual({
        study: 'Teststudy',
        visibility: 'allaudiences',
        title: 'Testtitle',
        description: 'Testdescription',
        type: 'relative_frequency_time_series',
      });
    });
  });

  describe('setConfiguration()', () => {
    it('should apply the configuration data to the form', () => {
      component.setConfiguration({
        study: 'Teststudy',
        visibility: 'allaudiences',
        title: 'Testtitle',
        description: 'Testdescription',
        type: 'relative_frequency_time_series',
      });

      expect(component.form.getRawValue()).toEqual({
        study: 'Teststudy',
        visibility: 'allaudiences',
        title: 'Testtitle',
        description: 'Testdescription',
        type: 'relative_frequency_time_series',
      });
    });
  });
});
