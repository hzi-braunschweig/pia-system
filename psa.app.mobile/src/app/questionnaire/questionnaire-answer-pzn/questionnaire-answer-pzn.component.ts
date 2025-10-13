/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';
import { AbstractTextInputControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-text-input-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';

const QUESTIONNAIRE_ANSWER_PZN_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerPznComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-pzn',
  templateUrl: './questionnaire-answer-pzn.component.html',
  providers: [QUESTIONNAIRE_ANSWER_PZN_ACCESSOR],
  standalone: false,
})
export class QuestionnaireAnswerPznComponent extends AbstractTextInputControlValueAccessor<FormControlValue> {
  constructor(private readonly backButton: BackButtonService) {
    super();
  }

  async onScanningBarcode() {
    this.backButton.disable();
    const barcodeData = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL,
    });

    if (barcodeData.ScanResult) {
      this.control.setValue(barcodeData.ScanResult);
      this.control.markAsDirty();
    }
    this.backButton.enable();
  }
}
