/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { IonIcon } from '@ionic/angular';
import { MockBuilder, MockInstance, MockRender, ngMocks } from 'ng-mocks';
import { MarkdownComponent } from 'ngx-markdown';
import { QuestionnaireQuestionTextComponent } from './questionnaire-question-text.component';

describe('QuestionnaireQuestionTextComponent', () => {
  beforeEach(
    async () =>
      await MockBuilder(QuestionnaireQuestionTextComponent)
        .mock(MarkdownComponent)
        .mock(IonIcon)
  );

  it('should show help text if given', () => {
    const dataSetterSpy = MockInstance(
      MarkdownComponent,
      'data',
      jasmine.createSpy(),
      'set'
    );
    MockRender(QuestionnaireQuestionTextComponent, {
      helpText: 'This is my help text',
    });

    expect(dataSetterSpy).toHaveBeenCalledWith('This is my help text');
  });

  it('should not show help text markup if help text is not given', () => {
    MockRender(QuestionnaireQuestionTextComponent);

    const textElement = ngMocks.find('[data-unit-text]');
    const wrapperElement = ngMocks.find('[data-unit-help-text-wrapper]', null);

    expect(textElement).toBeTruthy();
    expect(wrapperElement).toBeFalsy();
  });
});
