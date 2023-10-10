/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, ViewChild } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { DialogMarkdownEditorData } from '../dialog-markdown-editor/dialog-markdown-editor.component';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';

export interface DialogMarkdownMailEditorData extends DialogMarkdownEditorData {
  initialSubject: string;
}

export interface DialogMarkdownMailEditorResponse {
  subject: string;
  markdownText: string;
}

@Component({
  selector: 'app-dialog-markdown-mail-editor',
  templateUrl: './dialog-markdown-mail-editor.component.html',
  styleUrls: ['./dialog-markdown-mail-editor.component.scss'],
})
export class DialogMarkdownMailEditorComponent {
  private static readonly piaPseudonymTagHtml =
    '<pia-pseudonym></pia-pseudonym>';

  @ViewChild(MarkdownEditorComponent, { static: false })
  markdownEditor: MarkdownEditorComponent;

  public subject: string = this.data.initialSubject;
  public text: string = this.data.initialText;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogMarkdownMailEditorData,
    public dialogRef: MatDialogRef<
      DialogMarkdownMailEditorComponent,
      DialogMarkdownMailEditorResponse
    >
  ) {}

  public insertPseudonymTag(): void {
    this.markdownEditor.insertTextAtCurrentSelection(
      DialogMarkdownMailEditorComponent.piaPseudonymTagHtml
    );
  }

  public async publish(): Promise<void> {
    if (this.hasContentChanged()) {
      this.dialogRef.close({
        subject: this.subject,
        markdownText: this.text,
      });
    }
  }

  public hasContentChanged() {
    return (
      this.subject !== this.data.initialSubject ||
      this.text !== this.data.initialText
    );
  }
}
