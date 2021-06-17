import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuestionnaireAnswerTextInputControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-text-input-control-value-accessor';

const QUESTIONNAIRE_ANSWER_INPUT_TEXT_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerInputTextComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-input-text',
  templateUrl: './questionnaire-answer-input-text.component.html',
  providers: [QUESTIONNAIRE_ANSWER_INPUT_TEXT_ACCESSOR],
})
export class QuestionnaireAnswerInputTextComponent extends QuestionnaireAnswerTextInputControlValueAccessor {}
