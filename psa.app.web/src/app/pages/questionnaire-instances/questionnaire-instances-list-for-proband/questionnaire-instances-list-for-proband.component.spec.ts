import { QuestionnaireInstancesListForProbandComponent } from './questionnaire-instances-list-for-proband.component';
import {
  MockBuilder,
  MockedComponentFixture,
  MockInstance,
  MockRender,
} from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';

describe('QuestionnaireInstancesListForProbandComponent', () => {
  let fixture: MockedComponentFixture<QuestionnaireInstancesListForProbandComponent>;

  beforeEach(async () => {
    await MockBuilder(QuestionnaireInstancesListForProbandComponent, AppModule);
    MockInstance(
      QuestionnaireService,
      'getQuestionnaireInstances',
      jasmine.createSpy().and.resolveTo([])
    );
  });

  beforeEach(() => {
    fixture = MockRender(QuestionnaireInstancesListForProbandComponent);
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    fixture.detectChanges();
  });
});
