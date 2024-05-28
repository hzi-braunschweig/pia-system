/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

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
import { DialogMarkdownMailEditorComponent } from './dialog-markdown-mail-editor.component';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('DialogMarkdownMailEditorComponent', () => {
  let component: DialogMarkdownMailEditorComponent;
  let fixture: ComponentFixture<DialogMarkdownMailEditorComponent>;

  let dialogRef: SpyObj<MatDialogRef<DialogMarkdownMailEditorComponent>>;

  beforeEach(async () => {
    dialogRef = createSpyObj<MatDialogRef<DialogMarkdownMailEditorComponent>>(
      'MatDialogRef',
      ['close']
    );

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MockComponent(MarkdownEditorComponent)],
      declarations: [DialogMarkdownMailEditorComponent, MockTranslatePipe],
      providers: [
        MockProvider(MAT_DIALOG_DATA, {
          dialogTitle: 'STUDY.EDIT_WELCOME_MAIL',
          initialSubject: 'some initial subject',
          initialText: 'some initial text',
        }),
        MockProvider(MatDialogRef, dialogRef),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogMarkdownMailEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show the dialog title', () => {
    const dialogTitle = fixture.debugElement.query(
      By.css('[data-unit="dialog-title"]')
    );
    expect(dialogTitle).not.toBeNull();
    expect(dialogTitle.nativeElement.innerText).toContain(
      'STUDY.EDIT_WELCOME_MAIL'
    );
  });

  it('should close the dialog and emit the edited mail', () => {
    component.subject = 'some new subject';
    component.text = 'some new text';
    fixture.detectChanges();

    const publishButton = fixture.debugElement.query(
      By.css('[data-unit="publish-text-button"]')
    );
    expect(publishButton).not.toBeNull();

    publishButton.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledOnceWith({
      subject: 'some new subject',
      markdownText: 'some new text',
    });
  });

  it('should close the dialog and not emit mail which did not change', () => {
    const publishButton = fixture.debugElement.query(
      By.css('[data-unit="publish-text-button"]')
    );
    expect(publishButton).not.toBeNull();

    publishButton.nativeElement.click();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should call MarkdownEditorComponent to insert a pseudonym tag', () => {
    component.markdownEditor = {
      insertTextAtCurrentSelection: jasmine.createSpy(),
    } as unknown as MarkdownEditorComponent;

    component.insertPseudonymTag();

    expect(
      component.markdownEditor.insertTextAtCurrentSelection
    ).toHaveBeenCalledWith('<pia-pseudonym></pia-pseudonym>');
  });
});
