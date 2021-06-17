import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuestionnaireAnswerControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-control-value-accessor';

const QUESTIONNAIRE_ANSWER_SINGLE_SELECT_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerSingleSelectComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-single-select',
  templateUrl: './questionnaire-answer-single-select.component.html',
  providers: [QUESTIONNAIRE_ANSWER_SINGLE_SELECT_ACCESSOR],
  styleUrls: ['./questionnaire-answer-single-select.component.scss'],
})
export class QuestionnaireAnswerSingleSelectComponent extends QuestionnaireAnswerControlValueAccessor {
  @Input()
  values: string[];
}
