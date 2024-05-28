/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { MatIcon } from '@angular/material/icon';
import { MockBuilder, MockInstance, MockRender, ngMocks } from 'ng-mocks';
import { MarkdownComponent } from 'ngx-markdown';
import { QuestionTextComponent } from './question-text.component';

describe('QuestionTextComponent', () => {
  beforeEach(
    async () =>
      await MockBuilder(QuestionTextComponent)
        .mock(MarkdownComponent)
        .mock(MatIcon)
  );

  it('should render help text as markdown', () => {
    const dataSetterSpy = MockInstance(
      MarkdownComponent,
      'data',
      jasmine.createSpy(),
      'set'
    );
    MockRender(QuestionTextComponent, {
      helpText: 'This is my help text',
    });

    expect(dataSetterSpy).toHaveBeenCalledWith('This is my help text');
  });

  it('should not show help text markup if help text is not given', () => {
    MockRender(QuestionTextComponent);

    const textElement = ngMocks.find('[data-unit-text]');
    const wrapperElement = ngMocks.find('[data-unit-help-text-wrapper]', null);

    expect(textElement).toBeTruthy();
    expect(wrapperElement).toBeFalsy();
  });
});
