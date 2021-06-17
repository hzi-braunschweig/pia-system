import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';

import { QuestionnaireAnswerTextInputControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-text-input-control-value-accessor';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

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
export class QuestionnaireAnswerPznComponent extends QuestionnaireAnswerTextInputControlValueAccessor {
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
