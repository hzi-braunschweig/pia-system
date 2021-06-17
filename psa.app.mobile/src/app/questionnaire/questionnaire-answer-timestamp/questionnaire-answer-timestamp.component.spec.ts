import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { QuestionnaireAnswerTimestampComponent } from './questionnaire-answer-timestamp.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireAnswerTimestampComponent', () => {
  let component: QuestionnaireAnswerTimestampComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerTimestampComponent>;

  let keyboard: SpyObj<Keyboard>;

  beforeEach(() => {
    keyboard = jasmine.createSpyObj('Keyboard', ['hide']);

    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireAnswerTimestampComponent,
        MockPipe(TranslatePipe),
      ],
      imports: [IonicModule.forRoot()],
      providers: [{ provide: Keyboard, useValue: keyboard }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
