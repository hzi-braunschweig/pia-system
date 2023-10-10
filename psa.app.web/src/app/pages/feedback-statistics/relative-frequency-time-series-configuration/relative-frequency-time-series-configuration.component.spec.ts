/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelativeFrequencyTimeSeriesConfigurationComponent } from './relative-frequency-time-series-configuration.component';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import SpyObj = jasmine.SpyObj;
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MockComponent, MockPipe } from 'ng-mocks';
import { HintComponent } from '../../../features/hint/hint.component';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { TimeSeriesItemComponent } from '../time-series-item/time-series-item.component';
import { MatSelectSearchModule } from '../../../features/mat-select-search/mat-select-search.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacySelectHarness as MatSelectHarness } from '@angular/material/legacy-select/testing';
import {
  createQuestion,
  createQuestionnaire,
} from '../../../psa.app.core/models/instance.helper.spec';

describe('RelativeFrequencyTimeSeriesConfigurationComponent', () => {
  let component: RelativeFrequencyTimeSeriesConfigurationComponent;
  let fixture: ComponentFixture<RelativeFrequencyTimeSeriesConfigurationComponent>;
  let loader: HarnessLoader;

  let questionnaireService: SpyObj<QuestionnaireService>;

  beforeEach(async () => {
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getQuestionnaires',
    ]);
    questionnaireService.getQuestionnaires.and.resolveTo({
      questionnaires: [
        createQuestionnaire({
          id: 1234,
          version: 1,
          name: 'Cyclic Questionnaire',
          cycle_unit: 'week',
          questions: [createQuestion({ id: 1 })],
        }),
        createQuestionnaire({ id: 1235, cycle_unit: 'once' }),
        createQuestionnaire({ id: 1235, cycle_unit: 'spontan' }),
        createQuestionnaire({ id: 1235, cycle_unit: 'date' }),
      ],
      links: { self: { href: 'some-link' } },
    });

    await TestBed.configureTestingModule({
      declarations: [
        RelativeFrequencyTimeSeriesConfigurationComponent,
        MockComponent(TimeSeriesItemComponent),
        MockPipe(TranslatePipe, (value) => value),
      ],
      providers: [
        { provide: QuestionnaireService, useValue: questionnaireService },
      ],
      imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatSelectSearchModule,
        NoopAnimationsModule,
        MockComponent(HintComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RelativeFrequencyTimeSeriesConfigurationComponent
    );
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    component.study = 'TestStudy';
    fixture.detectChanges();
  });

  describe('selectable options', () => {
    describe('questionnaires', () => {
      it('should only contain cyclic questionnaires', async () => {
        const select = await loader.getHarness(
          MatSelectHarness.with({
            selector: '[data-unit="questionnaire-select"]',
          })
        );
        await select.open();
        const options = await select.getOptions();
        expect(options.length).toBe(1);
        expect(await options.at(0).getText()).toEqual(
          'Cyclic Questionnaire (1)'
        );
      });
    });

    describe('answer options', () => {
      it('should only contain multiple or single choice answer options', async () => {
        component.form.controls.comparativeValues.controls.questionnaire.patchValue(
          {
            id: 1234,
            version: 1,
          }
        );
        fixture.detectChanges();

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
        component.form.controls.comparativeValues.controls.questionnaire.patchValue(
          {
            id: 1234,
            version: 1,
          }
        );
        component.form.controls.comparativeValues.controls.answerOptionValueCodes.patchValue(
          {
            id: 5,
            variableName: 'lesionsArms',
            valueCodes: [],
          }
        );
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

  describe('getConfiguration()', () => {
    it('should return the configuration dto', () => {
      component.form.patchValue({
        comparativeValues: {
          questionnaire: {
            id: 1234,
            version: 1,
          },
          answerOptionValueCodes: {
            id: null,
            variableName: null,
            valueCodes: [],
          },
        },
        timeSeries: [],
        intervalShift: {
          amount: -1,
          unit: 'week',
        },
        timeRange: {
          startDate: new Date('2020-02-01'),
          endDate: null,
        },
      });
      expect(component.getConfiguration()).toEqual({
        comparativeValues: {
          questionnaire: {
            id: 1234,
            version: 1,
          },
          answerOptionValueCodes: {
            id: null,
            variableName: null,
            valueCodes: [],
          },
        },
        timeSeries: [
          {
            id: undefined,
            color: null,
            label: null,
            questionnaire: {
              id: 1234,
              version: 1,
            },
            answerOptionValueCodes: {
              id: null,
              variableName: null,
              valueCodes: [],
            },
          },
        ],
        intervalShift: {
          amount: -1,
          unit: 'week',
        },
        timeRange: {
          startDate: '2020-02-01T00:00:00.000Z',
          endDate: null,
        },
      });
    });
  });

  describe('setConfiguration()', () => {
    it('should set the configuration', () => {
      component.setConfiguration({
        comparativeValues: {
          questionnaire: {
            id: 1234,
            version: 1,
          },
          answerOptionValueCodes: {
            id: null,
            variableName: null,
            valueCodes: [],
          },
        },
        timeSeries: [],
        intervalShift: {
          amount: -1,
          unit: 'week',
        },
        timeRange: {
          startDate: '2020-02-01',
          endDate: null,
        },
      });

      expect(component.form.value).toEqual({
        comparativeValues: {
          questionnaire: {
            id: 1234,
            version: 1,
          },
          answerOptionValueCodes: {
            id: null,
            variableName: null,
            valueCodes: [],
          },
        },
        timeSeries: [
          {
            color: null,
            label: null,
            answerOptionValueCodes: {
              id: null,
              variableName: null,
              valueCodes: [],
            },
          },
        ],
        intervalShift: {
          amount: -1,
          unit: 'week',
        },
        timeRange: {
          startDate: new Date('2020-02-01T00:00:00.000Z'),
        },
      });
    });
  });

  describe('addTimeSeries()', () => {
    it('should add an empty time series form', () => {
      component.addTimeSeries();
      expect(component.form.value.timeSeries.length).toBe(2);
      expect(component.form.value.timeSeries[1]).toEqual({
        color: null,
        label: null,
        answerOptionValueCodes: {
          id: null,
          variableName: null,
          valueCodes: [],
        },
      });
    });
  });

  describe('removeTimeSeries()', () => {
    it('should remove a time series entry at given index', () => {
      component.addTimeSeries();
      component.form.controls.timeSeries.controls
        .at(0)
        .controls.label.setValue('entry 1');
      component.form.controls.timeSeries.controls
        .at(1)
        .controls.label.setValue('entry 2');

      component.removeTimeSeries(0);
      expect(component.form.value.timeSeries.length).toBe(1);
      expect(component.form.value.timeSeries[0].label).toEqual('entry 2');
    });

    it('should replace the last time series entry by an empty one', () => {
      component.form.controls.timeSeries.controls
        .at(0)
        .controls.label.setValue('entry 1');

      component.removeTimeSeries(0);
      expect(component.form.value.timeSeries.length).toBe(1);
      expect(component.form.value.timeSeries[0].label).toEqual(null);
    });
  });

  describe('resetTimeSeries()', () => {
    it('should reset the time series form', () => {
      component.addTimeSeries();
      component.form.controls.timeSeries.controls
        .at(0)
        .controls.label.setValue('entry 1');
      component.form.controls.timeSeries.controls
        .at(1)
        .controls.label.setValue('entry 2');

      component.resetTimeSeries();
      expect(component.form.value.timeSeries.length).toBe(1);
      expect(component.form.value.timeSeries[0]).toEqual({
        color: null,
        label: null,
        answerOptionValueCodes: {
          id: null,
          variableName: null,
          valueCodes: [],
        },
      });
    });
  });
});
