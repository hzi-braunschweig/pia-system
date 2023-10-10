/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';

export interface DialogMarkdownEditorData {
  dialogTitle: string;
  initialText: string;
}

@Component({
  selector: 'app-dialog-markdown-editor',
  templateUrl: './dialog-markdown-editor.component.html',
})
export class DialogMarkdownEditorComponent {
  text: string = this.data.initialText;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogMarkdownEditorData,
    public dialogRef: MatDialogRef<DialogMarkdownEditorComponent, string>
  ) {}

  public async publish(): Promise<void> {
    if (this.hasTextChanged()) {
      this.dialogRef.close(this.text);
    }
  }

  public hasTextChanged() {
    return this.text !== this.data.initialText;
  }
}
