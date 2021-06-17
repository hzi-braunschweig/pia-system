import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';

import { QuestionnaireAnswerControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-control-value-accessor';

const QUESTIONNAIRE_ANSWER_CHECKBOX_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerCheckboxComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-checkbox',
  templateUrl: './questionnaire-answer-checkbox.component.html',
  providers: [QUESTIONNAIRE_ANSWER_CHECKBOX_ACCESSOR],
})
export class QuestionnaireAnswerCheckboxComponent
  extends QuestionnaireAnswerControlValueAccessor
  implements OnInit, OnDestroy
{
  @Input()
  values: string[] = [];

  /**
   * see {@link QuestionnaireAnswerCheckboxComponent#setUpNoAnswerBehaviour}
   */
  readonly NO_ANSWER_VALUE = 'Keine Angabe';

  form: FormArray = new FormArray([]);

  private noAnswerSubscription: Subscription;
  private otherAnswersSubscription: Subscription;

  ngOnInit() {
    this.values.forEach(() => this.form.push(new FormControl(false)));
    this.setUpNoAnswerBehaviour();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.cancelSubscriptions();
  }

  registerOnChange(onChange: (value: string[]) => void) {
    this.subscription = this.form.valueChanges.subscribe(
      (selected: boolean[]) => this.onChange(selected, onChange)
    );
  }

  writeValue(selected: string[]) {
    this.values.forEach((value, index) =>
      this.form
        .at(index)
        .setValue(selected.includes(value), { emitEvent: false })
    );
  }

  onChange(selected: boolean[], onChange: (value: string[]) => void) {
    onChange(this.values.filter((value, index) => selected[index]));
  }

  /**
   * The value "Keine Angabe" (= no information) is hard-coded with a special behaviour:
   * As soon as it is chosen, no other option may be selected, so those will be reset.
   * If "Keine Angabe" is currently selected and another option is chosen, "Keine Angabe"
   * will be reset.
   *
   * This logic has the potential of starting a change loop within the form. Thus, it has
   * to be handled carefully. This is why the logic might seem overly complex.
   */
  private setUpNoAnswerBehaviour() {
    const noAnswerValueIndex = this.values.indexOf(this.NO_ANSWER_VALUE);
    if (noAnswerValueIndex !== -1) {
      const noAnswerFormControl = this.form.at(noAnswerValueIndex);
      const otherFormControls = this.form.controls.filter(
        (control, index) => index !== noAnswerValueIndex
      );
      this.noAnswerSubscription = noAnswerFormControl.valueChanges
        .pipe(filter(Boolean))
        .subscribe(() =>
          otherFormControls.forEach((control) => control.patchValue(false))
        );
      this.otherAnswersSubscription = merge(
        ...otherFormControls.map((control) => control.valueChanges)
      )
        .pipe(filter(Boolean))
        .subscribe(() => noAnswerFormControl.patchValue(false));
    }
  }

  private cancelSubscriptions() {
    if (this.noAnswerSubscription) {
      this.noAnswerSubscription.unsubscribe();
    }
    if (this.otherAnswersSubscription) {
      this.otherAnswersSubscription.unsubscribe();
    }
  }
}
