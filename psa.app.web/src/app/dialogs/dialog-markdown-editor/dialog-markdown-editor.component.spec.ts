/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMarkdownEditorComponent } from './dialog-markdown-editor.component';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';
import { By } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('DialogMarkdownEditorComponent', () => {
  let component: DialogMarkdownEditorComponent;
  let fixture: ComponentFixture<DialogMarkdownEditorComponent>;

  let dialogRef: SpyObj<MatDialogRef<DialogMarkdownEditorComponent>>;

  beforeEach(async () => {
    dialogRef = createSpyObj<MatDialogRef<DialogMarkdownEditorComponent>>(
      'MatDialogRef',
      ['close']
    );

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MockComponent(MarkdownEditorComponent)],
      declarations: [DialogMarkdownEditorComponent, MockTranslatePipe],
      providers: [
        MockProvider(MAT_DIALOG_DATA, {
          dialogTitle: 'STUDY.EDIT_WELCOME_TEXT',
          initialText: 'some initial text',
        }),
        MockProvider(MatDialogRef, dialogRef),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogMarkdownEditorComponent);
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

    expect(dialogRef.close).toHaveBeenCalledOnceWith('some new text');
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
