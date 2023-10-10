/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackStatisticListComponent } from './feedback-statistic-list.component';
import { CurrentUser } from '../../../_services/current-user.service';
import SpyObj = jasmine.SpyObj;
import { MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';

describe('FeedbackStatisticListComponent', () => {
  let component: FeedbackStatisticListComponent;
  let fixture: ComponentFixture<FeedbackStatisticListComponent>;

  let currentUser: SpyObj<CurrentUser>;

  beforeEach(async () => {
    currentUser = jasmine.createSpyObj('CurrentUser', [
      'isProband',
      'isProfessional',
    ]);
    currentUser.isProband.and.returnValue(false);
    currentUser.isProfessional.and.returnValue(true);

    await TestBed.configureTestingModule({
      declarations: [FeedbackStatisticListComponent],
      providers: [MockProvider(CurrentUser, currentUser)],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show the researcher feedback statistic list', () => {
    expect(component).toBeTruthy();
    expect(
      fixture.debugElement.query(
        By.css('[data-unit="feedback-statistic-list-researcher"]')
      )
    ).not.toBeNull();
  });
});
