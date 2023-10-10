/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackStatisticComponent } from './feedback-statistic.component';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { FeedbackStatisticBarChartComponent } from '@pia-system/charts';
import { MarkdownPipe } from 'ngx-markdown';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { createFakeFeedbackStatisticDto } from '../create-fake-feedback-statistic-dto.spec';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../../../_services/current-user.service';

describe('FeedbackStatisticComponent', () => {
  let component: FeedbackStatisticComponent;
  let fixture: ComponentFixture<FeedbackStatisticComponent>;

  let currentUser: SpyObj<CurrentUser>;

  beforeEach(async () => {
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      locale: 'en-US',
    });

    await TestBed.configureTestingModule({
      declarations: [
        FeedbackStatisticComponent,
        MockComponent(FeedbackStatisticBarChartComponent),
        MockPipe(MarkdownPipe),
        MockPipe(TranslatePipe),
      ],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [MockProvider(CurrentUser, currentUser)],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticComponent);
    component = fixture.componentInstance;
    component.feedbackStatisticDto = createFakeFeedbackStatisticDto();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
