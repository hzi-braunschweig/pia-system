import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireProgressBarComponent } from './questionnaire-progress-bar.component';

describe('QuestionnaireProgressBarComponent', () => {
  let component: QuestionnaireProgressBarComponent;
  let fixture: ComponentFixture<QuestionnaireProgressBarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnaireProgressBarComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
