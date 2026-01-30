/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';
import {
  IonModal,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonImg,
  IonIcon,
} from '@ionic/angular/standalone';
import { format } from 'date-fns';
import { Camera, CameraResultType, ImageOptions } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, trash } from 'ionicons/icons';
import { NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

const QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerImageComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-image',
  templateUrl: './questionnaire-answer-image.component.html',
  providers: [QUESTIONNAIRE_ANSWER_IMAGE_ACCESSOR],
  imports: [
    NgIf,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonImg,
    IonIcon,
    TranslateModule,
  ],
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
    addIcons({ camera, trash });
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
