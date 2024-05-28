/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSeriesItemComponent } from './time-series-item.component';
import { RelativeFrequencyTimeSeriesConfigurationFormService } from '../relative-frequency-time-series-configuration/relative-frequency-time-series-configuration-form.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { HintComponent } from '../../../features/hint/hint.component';
import { MockComponent, MockPipe } from 'ng-mocks';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectSearchModule } from '../../../features/mat-select-search/mat-select-search.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectHarness } from '@angular/material/select/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import {
  createQuestion,
  createQuestionnaire,
} from '../../../psa.app.core/models/instance.helper.spec';
import { SimpleChange } from '@angular/core';

describe('TimeSeriesItemComponent', () => {
  let component: TimeSeriesItemComponent;
  let fixture: ComponentFixture<TimeSeriesItemComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeSeriesItemComponent, MockPipe(TranslatePipe)],
      providers: [RelativeFrequencyTimeSeriesConfigurationFormService],
      imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectSearchModule,
        NoopAnimationsModule,
        MockComponent(HintComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSeriesItemComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    component.form = component.formService.getTimeSeriesForm();
    component.form.controls.questionnaire.setValue({
      id: 1234,
      version: 1,
    });
    component.selectedQuestionnaire = createQuestionnaire({
      id: 1234,
      version: 1,
      name: 'Cyclic Questionnaire',
      cycle_unit: 'week',
      questions: [createQuestion({ id: 1 })],
    });
    fixture.detectChanges();
    component.ngOnChanges({
      form: new SimpleChange(null, component.form, true),
      selectedQuestionnaire: new SimpleChange(
        null,
        component.selectedQuestionnaire,
        true
      ),
    });
  });

  describe('selectable options', () => {
    describe('questionnaires', () => {
      it('should be preselected and disabled', async () => {
        const select = await loader.getHarness(
          MatSelectHarness.with({
            selector: '[data-unit="questionnaire-select"]',
          })
        );
        expect(await select.isDisabled()).toBeTrue();
      });
    });

    describe('answer options', () => {
      it('should only contain multiple or single choice answer options', async () => {
        const select = await loader.getHarness(
          MatSelectHarness.with({
            selector: '[data-unit="answer-option-select"]',
          })
        );
        await select.open();
        const options = await select.getOptions();
        const optionTexts: string[] = await Promise.all(
          options.map((option) => option.getText())
        );
        expect(options.length).toEqual(3);
        expect(optionTexts[0]).toContain('(lesionsArms)');
        expect(optionTexts[1]).toContain('(lesionsFace)');
        expect(optionTexts[2]).toContain('(temperatureSource)');
      });
    });

    describe('value codes', () => {
      it('should only contain value codes of the selected answer option', async () => {
        component.form.controls.questionnaire.patchValue({
          id: 1234,
          version: 1,
        });
        component.form.controls.answerOptionValueCodes.patchValue({
          id: 5,
          variableName: 'lesionsArms',
          valueCodes: [],
        });
        fixture.detectChanges();

        const select = await loader.getHarness(
          MatSelectHarness.with({
            selector: '[data-unit="value-codes-select"]',
          })
        );
        await select.open();
        const options = await select.getOptions();
        const optionTexts: string[] = await Promise.all(
          options.map((option) => option.getText())
        );
        expect(options.length).toEqual(2);
        expect(optionTexts[0]).toContain('(1)');
        expect(optionTexts[1]).toContain('(0)');
      });
    });
  });
});
