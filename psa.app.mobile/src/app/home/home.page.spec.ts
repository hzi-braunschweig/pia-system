/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';

import { HomePage } from './home.page';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { HomePageModule } from './home.module';
import { AuthService } from '../auth/auth.service';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../auth/current-user.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  let questionnaireClient: SpyObj<QuestionnaireClientService>;
  let currentUser: SpyObj<CurrentUser>;

  beforeEach(async () => {
    // Provider and Services
    currentUser = jasmine.createSpyObj<CurrentUser>('CurrentUser', [], {
      study: 'Teststudy',
    });
    questionnaireClient = jasmine.createSpyObj<QuestionnaireClientService>(
      'QuestionnaireClientService',
      ['getStudyWelcomeText']
    );

    // Build Base Module
    await MockBuilder(HomePage, HomePageModule)
      .mock(QuestionnaireClientService, questionnaireClient)
      .mock(CurrentUser, currentUser);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    questionnaireClient.getStudyWelcomeText.and.resolveTo({
      study_id: 'Teststudy',
      welcome_text: 'Welcome!',
      language: 'en-US',
    });

    // Create component
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  it('should contain a welcome text', fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[unit-welcome-text]').textContent
    ).toEqual('Welcome!');
  }));
});
