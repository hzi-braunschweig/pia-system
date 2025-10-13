/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';
import { IonModal } from '@ionic/angular';
import { format } from 'date-fns';
import { Camera, CameraResultType, ImageOptions } from '@capacitor/camera';

const QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerImageComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-image',
  templateUrl: './questionnaire-answer-image.component.html',
  providers: [QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR],
  standalone: false,
})
export class QuestionnaireAnswerImageComponent extends AbstractControlValueAccessor<FormControlValue> {
  private readonly cameraOptions: ImageOptions = {
    resultType: CameraResultType.Base64,
    width: 1000,
    height: 1000,
  };

  @ViewChild(IonModal) modal: IonModal;

  imageName: string;

  constructor() {
    super();
    this.control.valueChanges.subscribe(
      (value) => (this.imageName = value?.fileName ?? null)
    );
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async onOpenCamera() {
    try {
      const imageData = await Camera.getPhoto(this.cameraOptions);
      if (imageData.base64String) {
        const fileName = 'photo_' + format(new Date(), 'yyyyMMddHHmm') + '.jpg';
        const base64Image = 'data:image/jpeg;base64,' + imageData.base64String;
        this.control.setValue({ fileName, file: base64Image });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async onDeleteImage() {
    this.control.reset(null);
  }
}
