/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { QuestionProbandComponent } from '../../question-proband.component';
import { AppModule } from '../../../../../app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { TimestampAnswerOptionComponent } from './timestamp-answer-option.component';
import { By } from '@angular/platform-browser';

describe('TimestampAnswerOptionComponent', () => {
  let fixture: MockedComponentFixture;
  let component: TimestampAnswerOptionComponent;

  beforeEach(async () => {
    // Build Base Module
    await MockBuilder(TimestampAnswerOptionComponent, AppModule);

    // Create component
    fixture = MockRender(TimestampAnswerOptionComponent);
    component = fixture.point.componentInstance;
  });

  it('should set the current time on button click', () => {
    // Arrange
    const beforeClick = Date.now();
    expect(component.timestamp).toBeNull();
    const button = fixture.debugElement.query(
      By.css('[data-unit="set-timestamp-button"]')
    );

    // Act
    button.nativeElement.click();
    fixture.detectChanges();

    // Assert
    expect(component.timestamp).toBeGreaterThanOrEqual(beforeClick);
  });

  it('should parse the timestamp on blur', () => {
    // Arrange
    const expectedDate = new Date('2022-12-31T11:59');

    // Act
    component.textInputBlurred('11:59 31.12.22');

    // Assert
    expect(component.timestamp).toBeInstanceOf(Date);
    expect(component.timestamp.getTime()).toEqual(expectedDate.getTime());
  });
});
