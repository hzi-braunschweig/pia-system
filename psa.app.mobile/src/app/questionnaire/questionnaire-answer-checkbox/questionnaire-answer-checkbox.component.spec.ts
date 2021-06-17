import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerCheckboxComponent } from './questionnaire-answer-checkbox.component';

describe('QuestionnaireAnswerCheckboxComponent', () => {
  let component: QuestionnaireAnswerCheckboxComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerCheckboxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerCheckboxComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
