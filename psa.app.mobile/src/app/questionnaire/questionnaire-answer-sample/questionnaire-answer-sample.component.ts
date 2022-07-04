/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { SampleAnswer } from '../../lab-result/lab-result.model';
import { SampleTrackingClientService } from '../../lab-result/sample-tracking-client.service';
import { QuestionnaireAnswerValidators } from '../questionnaire-form/questionnaire-answer-validators';
import { SampleFormControlValue } from '../questionnaire-form/questionnaire-form.service';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

const QUESTIONNAIRE_ANSWER_SAMPLE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerSampleComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-sample',
  templateUrl: './questionnaire-answer-sample.component.html',
  providers: [QUESTIONNAIRE_ANSWER_SAMPLE_ACCESSOR],
})
export class QuestionnaireAnswerSampleComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input()
  label: string;

  @Input()
  name: string | number;

  @Input()
  userId: string;

  @Input()
  samplePrefix: string;

  @Input()
  sampleSuffixLength: number;

  @Input()
  hasRnaSamples: boolean;

  @Output()
  sampleSaved: EventEmitter<void> = new EventEmitter<void>();

  form: FormGroup;

  putSampleError: string | null = null;

  QuestionnaireAnswerValidationErrors = QuestionnaireAnswerValidators.Errors;

  private onChange: (value: SampleFormControlValue) => void;

  private subscription: Subscription;

  constructor(
    private sampleTrackingClient: SampleTrackingClientService,
    private barcodeScanner: BarcodeScanner,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private keyboard: Keyboard,
    private backButton: BackButtonService
  ) {}

  ngOnInit() {
    this.form = new FormGroup(
      {
        sampleId1: new FormControl(
          null,
          QuestionnaireAnswerValidators.sampleId(
            this.samplePrefix,
            this.sampleSuffixLength
          )
        ),
        sampleId2: new FormControl(
          null,
          QuestionnaireAnswerValidators.sampleId(
            this.samplePrefix,
            this.sampleSuffixLength
          )
        ),
      },
      QuestionnaireAnswerValidators.sampleMatch(
        this.samplePrefix,
        this.hasRnaSamples
      )
    );

    this.subscription = this.form.valueChanges.subscribe(
      () => (this.putSampleError = null)
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  registerOnChange(onChange: (value: SampleFormControlValue) => void) {
    this.onChange = onChange;
  }

  registerOnTouched(fn) {}

  writeValue(value: SampleFormControlValue) {
    // the control is disabled if sampleIds were already saved
    if (value && (value.sampleId1 || value.sampleId2)) {
      this.form.disable();
      this.form.setValue(value);
    }
  }

  /**
   * The control can only be disabled from the outside.
   * If it was disabled once, it cannot be enabled again,
   * as the sampleIds migth already be saved.
   */
  setDisabledState(isDisabled: boolean) {
    if (isDisabled) {
      this.form.disable();
    }
  }

  hideKeyboard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.keyboard.isVisible) {
      this.keyboard.hide();
    }
  }

  async onScanningBarcode(controlName: keyof SampleFormControlValue) {
    this.backButton.disable();
    const barcodeData = await this.barcodeScanner.scan({
      showFlipCameraButton: true,
    });
    if (barcodeData.text) {
      this.form.get(controlName).setValue(barcodeData.text);
      this.form.get(controlName).markAsDirty();
    }
    this.backButton.enable();
  }

  canSubmit() {
    return (
      this.form.valid &&
      (this.form.value.sampleId1 || this.form.value.sampleId2)
    );
  }

  async submitSample() {
    if (!this.canSubmit()) {
      return;
    }

    const prefixCheckLocation =
      this.samplePrefix.length + 1 + (this.samplePrefix ? 1 : 0);
    const answer: SampleAnswer = { date_of_sampling: new Date() };
    const value: SampleFormControlValue = this.form.value;
    let sampleId;

    if (this.hasRnaSamples) {
      if (
        value.sampleId1.charAt(prefixCheckLocation) === '0' &&
        value.sampleId2.charAt(prefixCheckLocation) === '1'
      ) {
        sampleId = value.sampleId1;
        answer.dummy_sample_id = value.sampleId2;
      } else if (
        value.sampleId1.charAt(prefixCheckLocation) === '1' &&
        value.sampleId2.charAt(prefixCheckLocation) === '0'
      ) {
        sampleId = value.sampleId2;
        answer.dummy_sample_id = value.sampleId1;
      }
    } else {
      // do not check for 0 or 1 if we only have one sample
      sampleId = value.sampleId1;
    }

    if (!sampleId || !(!this.hasRnaSamples || answer.dummy_sample_id !== '')) {
      return;
    }

    try {
      const sample = await this.sampleTrackingClient.putSampleAnswer(
        this.userId,
        sampleId,
        answer
      );
      if (sample.id) {
        this.showSampleSubmitAlert();

        this.onChange(value);
        this.sampleSaved.emit();
        this.form.disable();
      } else {
        this.showSampleWarningAlert();
      }
    } catch (error) {
      if (
        error.message ===
        'Dummy_sample_id does not match the one in the database'
      ) {
        // set error on dummy_sample_id
        if (value.sampleId1.charAt(prefixCheckLocation) === '1') {
          this.putSampleError = 'sample_id_1_does_not_exist';
        } else {
          this.putSampleError = 'sample_id_2_does_not_exist';
        }
      } else if (error.message === 'Labresult does not exist') {
        // set error on sample_id
        if (value.sampleId1.charAt(prefixCheckLocation) === '0') {
          this.putSampleError = 'sample_id_1_does_not_exist';
        } else {
          this.putSampleError = 'sample_id_2_does_not_exist';
        }
      } else if (
        error.message ===
        'Sample_id does not belong to Proband or it does not exist in db or update params are missing'
      ) {
        this.putSampleError = 'already_scanned';
      }
      this.showSampleWarningAlert();
    }
  }

  private async showSampleSubmitAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('GENERAL.SUCCESSFUL'),
      message: this.translate.instant(
        'QUESTIONNAIRE_QUESTIONS.ALERT_SUBTITLE_PROBE_SENT'
      ),
      buttons: ['OK'],
    });
    alert.present();
  }

  private async showSampleWarningAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('GENERAL.WARNING'),
      message: this.translate.instant(
        'QUESTIONNAIRE_QUESTIONS.ALERT_SUBTITLE_NOT_SENT'
      ),
      buttons: ['OK'],
    });
    alert.present();
  }
}
