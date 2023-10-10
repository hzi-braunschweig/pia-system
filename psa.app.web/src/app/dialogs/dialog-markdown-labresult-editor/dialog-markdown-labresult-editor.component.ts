/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { DialogMarkdownEditorData } from '../dialog-markdown-editor/dialog-markdown-editor.component';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-dialog-markdown-labresult-editor',
  templateUrl: './dialog-markdown-labresult-editor.component.html',
  styleUrls: ['./dialog-markdown-labresult-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogMarkdownLabresultEditorComponent {
  @ViewChild(MarkdownEditorComponent, { static: false })
  markdownEditor: MarkdownEditorComponent;

  public text: string = this.data.initialText;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogMarkdownEditorData,
    public dialogRef: MatDialogRef<
      DialogMarkdownLabresultEditorComponent,
      string
    >
  ) {}

  public async publish(): Promise<void> {
    if (this.hasContentChanged()) {
      this.dialogRef.close(this.text);
    }
  }

  public hasContentChanged() {
    return this.text !== this.data.initialText;
  }
}
