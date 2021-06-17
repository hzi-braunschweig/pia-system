import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-answer-error',
  templateUrl: './questionnaire-answer-error.component.html',
})
export class QuestionnaireAnswerErrorComponent {
  @Input()
  control: AbstractControl;

  @Input()
  errorCode: string;
}
