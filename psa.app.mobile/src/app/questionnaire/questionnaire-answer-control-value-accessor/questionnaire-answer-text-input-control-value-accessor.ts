import { Component } from '@angular/core';
import { Keyboard } from '@ionic-native/keyboard/ngx';

import { QuestionnaireAnswerControlValueAccessor } from './questionnaire-answer-control-value-accessor';

/**
 * This abstract class needs to be declared as Component in order to be
 * correctly picked up by the Angular compiler. Nevertheless it is not
 * intended to be used as Component directly.
 *
 * @see {@link https://v9.angular.io/guide/deprecations#undecorated-base-classes-using-angular-features}
 */
@Component({ template: '' })
// tslint:disable-next-line:component-class-suffix
export abstract class QuestionnaireAnswerTextInputControlValueAccessor extends QuestionnaireAnswerControlValueAccessor {
  constructor(protected keyboard: Keyboard) {
    super();
  }

  hideKeyboard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.keyboard.isVisible) {
      this.keyboard.hide();
    }
  }
}
