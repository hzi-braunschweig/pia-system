import { ComponentFixture } from '@angular/core/testing';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';

import { QuestionnaireListPage } from './questionnaire-list.page';
import { QuestionnaireModule } from '../questionnaire.module';
import { ActivatedRoute, Router } from '@angular/router';
import createSpyObj = jasmine.createSpyObj;

describe('QuestionnaireListPage', () => {
  let component: QuestionnaireListPage;
  let fixture: ComponentFixture<QuestionnaireListPage>;

  beforeEach(async () => {
    await MockBuilder(QuestionnaireListPage, QuestionnaireModule)
      .mock(Router)
      .mock(ActivatedRoute);

    MockInstance(
      ActivatedRoute,
      'queryParamMap',
      createSpyObj('Observable', ['subscribe'])
    );

    fixture = MockRender(QuestionnaireListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
