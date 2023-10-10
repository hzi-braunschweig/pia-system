/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogPopUpComponent } from '../../../../../_helpers/dialog-pop-up';

@Component({
  selector: 'app-file-answer-option',
  templateUrl: './file-answer-option.component.html',
  styleUrls: ['file-answer-option.component.scss'],
})
export class FileAnswerOptionComponent implements OnInit {
  constructor(
    private qService: QuestionnaireService,
    private dialog: MatDialog
  ) {}

  url = '';

  @Input() fileId: any;
  @Input() question_id?: number;
  @Input() answer_option_id?: number;
  @Input() questionnaire_instance_id: number;
  @Input() answerOptionIndex: number;
  @Input() isReadOnly: boolean;
  @Output() fileResult = new EventEmitter<{
    dataAsUrl: any;
    answer_option_id: number;
    answerOptionIndex: number;
    file_name: string;
  }>();

  isLoading: boolean = false;
  fileName: string;
  maxFileSize = 20971520; // 20MB

  ngOnInit(): void {
    if (this.fileId && !isNaN(this.fileId)) {
      this.isLoading = true;
      this.qService
        .getFileBy(this.fileId)
        .then((file: any) => {
          this.fileName = file.file_name;
          this.url = file.file;
          this.isLoading = false;
        })
        .catch((err) => {
          console.log(`could not load the image err: ${err}`);
        });
    } else if (this.fileId && isNaN(this.fileId)) {
      this.fileName = JSON.parse(this.fileId).file_name;
    }
  }

  loadFile(f: File): void {
    if (
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.ms-excel' ||
      f.type.includes('csv')
    ) {
      if (f.size <= this.maxFileSize) {
        this.isLoading = true;
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = (event: any) => {
          this.fileName = f.name;
          this.url = event.target.result;
          this.fileResult.emit({
            dataAsUrl: this.url,
            answer_option_id: this.answer_option_id,
            answerOptionIndex: this.answerOptionIndex,
            file_name: this.fileName,
          });
          this.isLoading = false;
        };
      } else {
        this.openDialog('ANSWERS_PROBAND.UPLOADED_FILE_TOO_LARGE');
      }
    } else {
      this.openDialog('ANSWERS_PROBAND.SELECT_ONLY_FILE');
    }
  }

  onFileSelected(event): void {
    if (event.target.files && event.target.files[0]) {
      this.loadFile(event.target.files[0]);
    }
  }

  deleteFile(): void {
    this.url = null;
    this.fileId = null;
    this.fileName = '';
    this.fileResult.emit({
      dataAsUrl: '',
      answer_option_id: this.answer_option_id,
      answerOptionIndex: this.answerOptionIndex,
      file_name: '',
    });
  }

  openFile(): void {
    const contentType = this.url.split(';')[0].split(':')[1];
    const base64String = this.url.split(',')[1];

    const blob = this.b64toBlob(base64String, contentType);

    const link = document.createElement('a');
    link.target = '_blank';
    link.href = window.URL.createObjectURL(blob);
    link.click();
  }

  saveFile(): void {
    const contentType = this.url.split(';')[0].split(':')[1];
    const base64String = this.url.split(',')[1];

    const blob = this.b64toBlob(base64String, contentType);

    const link = document.createElement('a');
    link.download = this.fileName;
    link.href = window.URL.createObjectURL(blob);
    link.click();
  }

  b64toBlob(b64Data, contentType = '', sliceSize = 512): Blob {
    const byteCharacters = window.atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
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
