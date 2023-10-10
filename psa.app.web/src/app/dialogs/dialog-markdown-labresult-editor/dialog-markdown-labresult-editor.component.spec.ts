/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMarkdownLabresultEditorComponent } from './dialog-markdown-labresult-editor.component';
import { MockComponent, MockProvider } from 'ng-mocks';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogModule as MatDialogModule,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';
import { By } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('DialogMarkdownLabresultEditorComponent', () => {
  let component: DialogMarkdownLabresultEditorComponent;
  let fixture: ComponentFixture<DialogMarkdownLabresultEditorComponent>;

  let dialogRef: SpyObj<MatDialogRef<DialogMarkdownLabresultEditorComponent>>;

  beforeEach(async () => {
    dialogRef = createSpyObj<
      MatDialogRef<DialogMarkdownLabresultEditorComponent>
    >('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MockComponent(MarkdownEditorComponent)],
      declarations: [DialogMarkdownLabresultEditorComponent, MockTranslatePipe],
      providers: [
        MockProvider(MAT_DIALOG_DATA, {
          dialogTitle: 'STUDY.EDIT_WELCOME_TEXT',
          initialText: 'some initial text',
        }),
        MockProvider(MatDialogRef, dialogRef),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogMarkdownLabresultEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show the dialog title', () => {
    const dialogTitle = fixture.debugElement.query(
      By.css('[data-unit="dialog-title"]')
    );
    expect(dialogTitle).not.toBeNull();
    expect(dialogTitle.nativeElement.innerText).toContain(
      'STUDY.EDIT_WELCOME_TEXT'
    );
  });

  it('should close the dialog and emit the edited text', () => {
    component.text = 'some new text';
    fixture.detectChanges();

    const publishButton = fixture.debugElement.query(
      By.css('[data-unit="publish-text-button"]')
    );
    expect(publishButton).not.toBeNull();

    publishButton.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith('some new text');
  });

  it('should close the dialog and not emit text which did not change', () => {
    const publishButton = fixture.debugElement.query(
      By.css('[data-unit="publish-text-button"]')
    );
    expect(publishButton).not.toBeNull();

    publishButton.nativeElement.click();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
