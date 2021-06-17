import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { format } from 'date-fns';

import { QuestionnaireAnswerTextInputControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-text-input-control-value-accessor';

const QUESTIONNAIRE_ANSWER_TIMESTAMP_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerTimestampComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-timestamp',
  templateUrl: './questionnaire-answer-timestamp.component.html',
  providers: [QUESTIONNAIRE_ANSWER_TIMESTAMP_ACCESSOR],
})
export class QuestionnaireAnswerTimestampComponent extends QuestionnaireAnswerTextInputControlValueAccessor {
  onChange: (value: Date) => void;

  private static formatDate(date: Date): string {
    if (!date) {
      return null;
    }
    return format(date, 'HH:mm dd.MM.yyyy');
  }

  registerOnChange(onChange: (value: Date) => void) {
    this.onChange = onChange;
  }

  writeValue(value: Date) {
    this.control.patchValue(
      QuestionnaireAnswerTimestampComponent.formatDate(value)
    );
  }

  setTimestamp() {
    const now = new Date();
    this.control.setValue(
      QuestionnaireAnswerTimestampComponent.formatDate(now)
    );
    this.onChange(now);
  }
}
