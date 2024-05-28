/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteModule,
} from '@angular/material/autocomplete';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';

import { DialogMarkdownLabresultEditorComponent } from './dialog-markdown-labresult-editor.component';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

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
  let markdownEditorComponentMock: MarkdownEditorComponent;
  let sampleTrackingServiceMock: SampleTrackingService;

  beforeEach(async () => {
    dialogRef = createSpyObj<
      MatDialogRef<DialogMarkdownLabresultEditorComponent>
    >('MatDialogRef', ['close']);
    sampleTrackingServiceMock = jasmine.createSpyObj('SampleTrackingService', [
      'getLabObservationNames',
    ]);
    (
      sampleTrackingServiceMock.getLabObservationNames as jasmine.Spy
    ).and.returnValue([{ name: 'test' }]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatExpansionModule,
        MatListModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatAutocompleteModule,
        MatTooltipModule,
        MockComponent(MarkdownEditorComponent),
      ],
      declarations: [
        DialogMarkdownLabresultEditorComponent,
        MockTranslatePipe,
        MatAutocomplete,
      ],
      providers: [
        MockProvider(MAT_DIALOG_DATA, {
          dialogTitle: 'STUDY.EDIT_WELCOME_TEXT',
          initialText: 'some initial text',
        }),
        MockProvider(MatDialogRef, dialogRef),
        MockProvider(MarkdownEditorComponent, markdownEditorComponentMock),
        MockProvider(SampleTrackingService, sampleTrackingServiceMock),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogMarkdownLabresultEditorComponent);
    component = fixture.componentInstance;
    markdownEditorComponentMock = fixture.debugElement.query(
      By.directive(MarkdownEditorComponent)
    ).componentInstance;

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

  describe('Placeholder comfort options', () => {
    it('should add a placeholder to the markdown file when klicking on it', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-placeholder"]'))
        .nativeElement.click();

      fixture.debugElement
        .query(
          By.css(
            '[data-unit="placeholder-button-STUDY.LABRESULT_TEMPLATE.ADD_TAG_USER_ID"]'
          )
        )
        .nativeElement.click();

      expect(
        markdownEditorComponentMock.insertTextAtCurrentSelection
      ).toHaveBeenCalled();
    });
  });

  describe('Table comfort options', () => {
    beforeEach(() => {
      component.tableHeaders = [];
      component.tableColumns = [];
      fixture.detectChanges();
    });

    it('should disable the header button if attributeName is empty', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.headerTitle = 'Test';
      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css('[data-unit="add-header"]')
      ).nativeElement as HTMLButtonElement;

      expect(button.disabled).toBe(true);
    });

    it('should disable the header button if title is empty', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.headerAttributeName = 'Test';
      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css('[data-unit="add-header"]')
      ).nativeElement as HTMLButtonElement;

      expect(button.disabled).toBe(true);
    });

    it('should disable the column button if tableColumn is empty', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css('[data-unit="add-column"]')
      ).nativeElement as HTMLButtonElement;

      expect(button.disabled).toBe(true);
    });

    it('should add a table header', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.headerTitle = 'Test-Title';
      component.headerAttributeName = 'Test-Attribute';
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('[data-unit="add-header"]'))
        .nativeElement.click();

      fixture.detectChanges();

      expect(component.tableHeaders).toEqual([
        { title: 'Test-Title', attributeName: 'Test-Attribute' },
      ]);
    });

    it('should add a table in the markdown file with the defined headers', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.tableHeaders = [
        { title: 'Test-Title', attributeName: 'Test-Attribute' },
        { title: 'Test-Title2', attributeName: 'Test-Attribute2' },
      ];
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('[data-unit="add-table"]'))
        .nativeElement.click();

      expect(
        markdownEditorComponentMock.insertTextAtCurrentSelection
      ).toHaveBeenCalledWith(
        jasmine.stringContaining(
          `<pia-laboratory-result-table-header title="Test-Title" attributeName="Test-Attribute"></pia-laboratory-result-table-header>
<pia-laboratory-result-table-header title="Test-Title2" attributeName="Test-Attribute2"></pia-laboratory-result-table-header>`
        )
      );
    });

    it('should add table column', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.tableColumn = 'Test-Column';
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('[data-unit="add-column"]'))
        .nativeElement.click();

      fixture.detectChanges();

      expect(component.tableColumns).toEqual(['Test-Column']);
    });

    it('should add a table in the markdown file with the defined columns', () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-table"]'))
        .nativeElement.click();

      component.tableColumns = ['Test-Column', 'Test-Column2'];
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('[data-unit="add-table"]'))
        .nativeElement.click();

      expect(
        markdownEditorComponentMock.insertTextAtCurrentSelection
      ).toHaveBeenCalledWith(
        jasmine.stringContaining(
          `<pia-laboratory-result-table-entry name="Test-Column"></pia-laboratory-result-table-entry>
<pia-laboratory-result-table-entry name="Test-Column2"></pia-laboratory-result-table-entry>`
        )
      );
    });
  });

  describe('Image comfort options', () => {
    it('should add an image to the markdown file', async () => {
      fixture.debugElement
        .query(By.css('[data-unit="expansion-images"]'))
        .nativeElement.click();

      component.imageToInsert = new File(['file content'], 'test-name', {
        type: 'text/plain',
      });

      fixture.detectChanges();

      await component.insertImage();

      expect(
        markdownEditorComponentMock.insertTextAtCurrentSelection
      ).toHaveBeenCalledWith('<img src="![0]" alt="test-name" width="180">');
    });
  });

  describe('transformText', () => {
    it('should transform custom image tags to valid markdown tags', async () => {
      component.imageToInsert = new File(['file content'], 'test-name', {
        type: 'text/plain',
      });

      await component.insertImage();

      expect(
        component.transformTextBeforeRendering(
          '<img src="![0]" alt="test-name" width="180">'
        )
      ).toEqual(
        '<img src="data:text/plain;base64,ZmlsZSBjb250ZW50" alt="test-name" width="180">'
      );
    });

    it('should transform custom table tags to valid markdown tags', () => {
      expect(
        component.transformTextBeforeRendering(
          `<pia-laboratory-result-table>
<pia-laboratory-result-table-header title="PCR" attributeName="key"></pia-laboratory-result-table-header>
<pia-laboratory-result-table-header title="Ergebnis" attributeName=".result"></pia-laboratory-result-table-header>
<pia-laboratory-result-table-entry name="Adenovirus-PCR (resp.)"></pia-laboratory-result-table-entry>
</pia-laboratory-result-table>`
        )
      ).toEqual(
        '<table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th></tr><tr><td>Adenovirus-PCR (resp.)</td><td>Adenovirus-PCR (resp.).result</td></tr></table>'
      );
    });

    it('should transform custom table tags with default headers if no header is given', () => {
      expect(
        component.transformTextBeforeRendering(
          '<pia-laboratory-result-table><pia-laboratory-result-table-entry name="Adenovirus-PCR (resp.)"></pia-laboratory-result-table-entry></pia-laboratory-result-table>'
        )
      ).toEqual(
        `<table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th><th>Analysis Datum</th><th>Eingang der Probe</th><th>Datum der Ergebnismitteilung</th></tr><tr><td>Adenovirus-PCR (resp.)</td><td>Adenovirus-PCR (resp.).result</td><td>Adenovirus-PCR (resp.).date_of_analysis</td><td>Adenovirus-PCR (resp.).date_of_delivery</td><td>Adenovirus-PCR (resp.).date_of_announcement</td></tr></table>`
      );
    });

    it('should transform the images when closing the dialog and emit the transformed text', async () => {
      component.text =
        'some new text \n <img src="![0]" alt="test-name" width="180">';
      fixture.detectChanges();

      component.imageToInsert = new File(['file content'], 'test-name', {
        type: 'text/plain',
      });

      await component.insertImage();
      fixture.detectChanges();

      console.log(component.text);

      const publishButton = fixture.debugElement.query(
        By.css('[data-unit="publish-text-button"]')
      );
      expect(publishButton).not.toBeNull();

      publishButton.nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith(
        'some new text \n <img src="data:text/plain;base64,ZmlsZSBjb250ZW50" alt="test-name" width="180">'
      );
    });
  });
});
