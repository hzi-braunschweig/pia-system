/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatSelectSearchModule } from '../mat-select-search/mat-select-search.module';
import { MarkdownModule } from 'ngx-markdown';
import { TranslateModule } from '@ngx-translate/core';

const MARKDOWN_EDITOR_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MarkdownEditorComponent),
  multi: true,
};

@Component({
  standalone: true,
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
  providers: [MARKDOWN_EDITOR_VALUE_ACCESSOR],
  imports: [
    MatSelectSearchModule,
    ReactiveFormsModule,
    MarkdownModule,
    TranslateModule,
  ],
})
export class MarkdownEditorComponent
  implements ControlValueAccessor, OnDestroy
{
  @Input()
  public label = 'GENERAL.MARKDOWN_TEXT_INPUT';

  public text = new FormControl('');

  @ViewChild('markdownTextarea', { static: false, read: ElementRef })
  private markdownTextarea: ElementRef;

  private subscription: Subscription;

  public ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public registerOnChange(onChange: (value: string) => void) {
    this.subscription = this.text.valueChanges.subscribe((value) =>
      onChange(value)
    );
  }

  public registerOnTouched(fn) {}

  public writeValue(value: string) {
    this.text.patchValue(value);
  }

  public insertTextAtCurrentSelection(textToInsert: string): void {
    let start = this.markdownTextarea.nativeElement.selectionStart;
    let end = this.markdownTextarea.nativeElement.selectionEnd;

    this.text.setValue(
      this.text.value.slice(0, start) +
        textToInsert +
        this.text.value.slice(end)
    );

    this.markdownTextarea.nativeElement.selectionStart =
      this.markdownTextarea.nativeElement.selectionEnd =
        start + this.text.value.length;
  }
}
