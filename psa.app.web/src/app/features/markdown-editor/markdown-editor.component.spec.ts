/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownEditorComponent } from './markdown-editor.component';
import { Component, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MockModule } from 'ng-mocks';
import { MarkdownModule } from 'ngx-markdown';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';

@Component({
  selector: 'app-test-markdown-editor',
  template: `<app-markdown-editor
    [formControl]="control"
  ></app-markdown-editor>`,
})
class TestMarkdownEditorComponent {
  @ViewChild(MarkdownEditorComponent, { static: false })
  public markdownEditor: MarkdownEditorComponent;

  public control = new FormControl<string>('some initial text');
}

describe('MarkdownEditorComponent', () => {
  let component: TestMarkdownEditorComponent;
  let fixture: ComponentFixture<TestMarkdownEditorComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MarkdownEditorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      declarations: [TestMarkdownEditorComponent],
    })
      .overrideComponent(MarkdownEditorComponent, {
        remove: { imports: [MarkdownModule, TranslateModule] },
        add: {
          imports: [MockModule(MarkdownModule), MockModule(TranslateModule)],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TestMarkdownEditorComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should initialize textfield with initial text', async () => {
    const textarea = await loader.getHarness(MatInputHarness);
    expect(await textarea.getValue()).toEqual('some initial text');
  });

  it('should update the outer components form value', async () => {
    const textarea = await loader.getHarness(MatInputHarness);
    await textarea.setValue('some new text');
    expect(component.control.value).toEqual('some new text');
  });

  it('should insert text at the current selection', () => {
    component.markdownEditor.insertTextAtCurrentSelection('<some added text>');
    expect(component.control.value).toEqual(
      'some initial text<some added text>'
    );
  });
});
