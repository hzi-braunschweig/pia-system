import { QuestionnaireInstancesListForInvestigatorComponent } from './questionnaire-instances-list-for-investigator.component';
import {
  MockBuilder,
  MockedComponentFixture,
  MockInstance,
  MockRender,
} from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { ActivatedRoute, Router } from '@angular/router';

describe('QuestionnaireInstancesListForInvestigatorComponent', () => {
  let fixture: MockedComponentFixture<QuestionnaireInstancesListForInvestigatorComponent>;

  beforeEach(async () => {
    await MockBuilder(
      QuestionnaireInstancesListForInvestigatorComponent,
      AppModule
    )
      .keep(Router)
      .keep(ActivatedRoute);
    MockInstance(
      QuestionnaireService,
      'getQuestionnaireInstancesForUser',
      jasmine.createSpy().and.resolveTo({ questionnaireInstances: [] })
    );
    MockInstance(
      AuthService,
      'getUser',
      jasmine
        .createSpy()
        .and.resolveTo({ ids: '123456789', pseudonym: 'TEST-1234567890' })
    );
  });

  beforeEach(() => {
    fixture = MockRender(QuestionnaireInstancesListForInvestigatorComponent);
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    fixture.detectChanges();
  });
});
