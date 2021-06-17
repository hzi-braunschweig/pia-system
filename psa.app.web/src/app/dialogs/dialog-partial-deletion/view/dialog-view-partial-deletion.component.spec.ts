import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { DialogViewPartialDeletionComponent } from './dialog-view-partial-deletion.component';
import { AppModule } from '../../../app.module';
import { mock } from 'ts-mockito';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { LOCALE_ID } from '@angular/core';

describe('DialogViewPartialDeletionComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogViewPartialDeletionComponent;
  beforeEach(async () => {
    await MockBuilder(DialogViewPartialDeletionComponent, AppModule).provide({
      provide: LOCALE_ID,
      useValue: 'de-DE',
    });
    const instance = mock<QuestionnaireInstance>();
    instance.date_of_release_v2 = new Date();
    fixture = MockRender(DialogViewPartialDeletionComponent, {
      labResults: [],
      questionnaireInstances: [instance],
    });
    component = fixture.point.componentInstance;
  });

  it('should resolve, that one array is not empty', () => {
    expect(component).toBeDefined();
    expect(component.containsData()).toBeTrue();
  });
});
