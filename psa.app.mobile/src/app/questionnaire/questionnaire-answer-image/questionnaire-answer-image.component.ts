/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { Chooser, ChooserResult } from '@awesome-cordova-plugins/chooser/ngx';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';
import { IonModal } from '@ionic/angular';
import { format } from 'date-fns';

const QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerImageComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-image',
  templateUrl: './questionnaire-answer-image.component.html',
  providers: [QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR],
})
export class QuestionnaireAnswerImageComponent extends AbstractControlValueAccessor<FormControlValue> {
  private readonly cameraOptions: CameraOptions = {
    destinationType: this.camera.DestinationType.DATA_URL,
    targetWidth: 1000,
    targetHeight: 1000,
  };

  @ViewChild(IonModal) modal: IonModal;

  imageName: string;

  constructor(private camera: Camera, private chooser: Chooser) {
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
      const imageData = await this.camera.getPicture(this.cameraOptions);
      if (imageData) {
        const base64Image = 'data:image/jpeg;base64,' + imageData;
        const fileName = 'photo_' + format(new Date(), 'yyyyMMddHHmm') + '.jpg';
        this.control.setValue({ fileName, file: base64Image });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async onOpenChooser() {
    try {
      const imageData: ChooserResult = await this.chooser.getFile(
        'image/png, image/jpeg'
      );
      if (imageData) {
        this.control.setValue({
          fileName: imageData.name,
          file: imageData.dataURI,
        });
      }
    } catch (error) {
      console.warn(error);
    }
  }

  async onDeleteImage() {
    this.control.reset(null);
  }
}
