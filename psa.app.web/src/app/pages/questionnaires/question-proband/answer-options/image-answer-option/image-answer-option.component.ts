/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { TranslateService } from '@ngx-translate/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogPopUpComponent } from '../../../../../_helpers/dialog-pop-up';

@Component({
  selector: 'app-image-answer-option',
  templateUrl: './image-answer-option.component.html',
  styleUrls: ['image-answer-option.component.scss'],
})
export class ImageAnswerOptionComponent implements OnInit {
  public imageName: any;

  constructor(
    private qService: QuestionnaireService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  url = '';

  @Input() imgId: any;
  @Input() question_id?: number;
  @Input() answer_option_id?: number;
  @Input() questionnaire_instance_id: number;
  @Input() answerOptionIndex: number;
  @Input() isReadOnly: boolean;
  @Output() imgResult = new EventEmitter<{
    dataAsUrl: any;
    answer_option_id: number;
    answerOptionIndex: number;
    file_name: string;
  }>();
  isLoading: boolean = false;
  maxFileSize = 20971520; // 20MB

  ngOnInit(): void {
    // Do not remove "&& !isNaN(this.imgId)"
    // This fixes bug
    if (this.imgId && !isNaN(this.imgId)) {
      this.isLoading = true;
      this.qService
        .getImageBy(this.imgId)
        .then((image: any) => {
          this.url = image.file;
          this.imageName = image.file_name;
          this.isLoading = false;
        })
        .catch((err) => {
          console.log(`could not load the image err: ${err}`);
        });
    } else if (this.imgId && isNaN(this.imgId)) {
      this.url = JSON.parse(this.imgId).data;
    }
  }

  loadImage(f: File): void {
    if (f.type === 'image/jpeg' || f.type === 'image/png') {
      if (f.size <= this.maxFileSize) {
        this.isLoading = true;
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = (event: any) => {
          this.imageName = f.name;
          this.url = event.target.result;
          this.imgResult.emit({
            dataAsUrl: this.url,
            answer_option_id: this.answer_option_id,
            answerOptionIndex: this.answerOptionIndex,
            file_name: this.imageName,
          });
          this.isLoading = false;
        };
      } else {
        this.openDialog('ANSWERS_PROBAND.UPLOADED_FILE_TOO_LARGE');
      }
    } else {
      this.openDialog('ANSWERS_PROBAND.SELECT_ONLY_IMAGE');
    }
  }

  onImageSelected(event): void {
    if (event.target.files && event.target.files[0]) {
      this.loadImage(event.target.files[0]);
    }
  }

  deleteImage(): void {
    this.url = null;
    this.imgId = null;
    this.imageName = '';
    this.imgResult.emit({
      dataAsUrl: '',
      answer_option_id: this.answer_option_id,
      answerOptionIndex: this.answerOptionIndex,
      file_name: '',
    });
  }

  openDialog(message): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '400px',
      data: {
        q: 'ERROR.ERROR',
        content: message,
      },
    });
  }
}
