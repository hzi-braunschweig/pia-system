/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';
import { AbstractTextInputControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-text-input-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';

const QUESTIONNAIRE_ANSWER_PZN_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerPznComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-pzn',
  templateUrl: './questionnaire-answer-pzn.component.html',
  providers: [QUESTIONNAIRE_ANSWER_PZN_ACCESSOR],
})
export class QuestionnaireAnswerPznComponent extends AbstractTextInputControlValueAccessor<FormControlValue> {
  constructor(
    protected keyboard: Keyboard,
    private barcodeScanner: BarcodeScanner,
    private backButton: BackButtonService
  ) {
    super(keyboard);
  }

  async onScanningBarcode() {
    this.backButton.disable();
    const barcodeData = await this.barcodeScanner.scan({
      showFlipCameraButton: true,
    });
    if (barcodeData.text) {
      this.control.setValue(barcodeData.text);
      this.control.markAsDirty();
    }
    this.backButton.enable();
  }
}
