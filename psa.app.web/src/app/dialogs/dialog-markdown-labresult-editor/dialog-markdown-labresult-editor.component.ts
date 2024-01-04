/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { DialogMarkdownEditorData } from '../dialog-markdown-editor/dialog-markdown-editor.component';
import { MarkdownEditorComponent } from '../../features/markdown-editor/markdown-editor.component';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';

interface TagInfo {
  i18nIdentifier: string;
  tag: string;
}

interface TableHeader {
  title: string;
  attributeName: string;
}

@Component({
  selector: 'app-dialog-markdown-labresult-editor',
  templateUrl: './dialog-markdown-labresult-editor.component.html',
  styleUrls: ['./dialog-markdown-labresult-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogMarkdownLabresultEditorComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly TAGS_TO_INSERT: TagInfo[] = [
    {
      i18nIdentifier: 'STUDY.LABRESULT_TEMPLATE.ADD_TAG_USER_ID',
      tag: '{{user_id}}',
    },
    {
      i18nIdentifier: 'STUDY.LABRESULT_TEMPLATE.ADD_TAG_SAMPLE_ID',
      tag: '{{id}}',
    },
    {
      i18nIdentifier: 'STUDY.LABRESULT_TEMPLATE.ADD_TAG_DATE_OF_SAMPLING',
      tag: '{{date_of_sampling}}',
    },
    {
      i18nIdentifier: 'STUDY.LABRESULT_TEMPLATE.ADD_TAG_STATUS',
      tag: '{{status}}',
    },
  ];

  readonly possibleTableHeaderAttributes = [
    'key',
    '.result',
    '.date_of_analysis',
    '.date_of_delivery',
    '.date_of_announcement',
  ];
  tableHeaders: TableHeader[] = [];
  headerTitle = '';
  headerAttributeName = '';

  tableColumns: string[] = [];
  tableColumn = '';

  labObservationNames: string[] = [];

  isDragNDropHovered = false;
  imageToInsert?: File;
  private numberOfImages = 0;
  private imagesAsBase64: Record<number, string> = {};

  @ViewChild(MarkdownEditorComponent, { static: false })
  markdownEditor: MarkdownEditorComponent;

  public text: string = this.data.initialText;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogMarkdownEditorData,
    public dialogRef: MatDialogRef<
      DialogMarkdownLabresultEditorComponent,
      string
    >,
    private sampleTrackingService: SampleTrackingService
  ) {}

  async ngOnInit() {
    const existingLabObservationNamesInDatabase = (
      await this.sampleTrackingService.getLabObservationNames()
    ).map((labObservation) => labObservation.name);

    if (
      existingLabObservationNamesInDatabase &&
      existingLabObservationNamesInDatabase.length > 0
    ) {
      this.labObservationNames = existingLabObservationNamesInDatabase;
    }
  }

  transformTextBeforeRendering = (text: string): string => {
    return this.transformTables(this.transformImages(text));
  };

  transformImages = (text: string): string => {
    const regex = /<img src="!\[(\d+)\]"/g;

    return text.replace(regex, (_, number) => {
      const data = this.imagesAsBase64[number];
      return `<img src="${data}"`;
    });
  };

  transformTables = (text: string): string => {
    const tableRegex =
      /<pia-laboratory-result-table>(.*?)<\/pia-laboratory-result-table>/gs;

    return text.replace(tableRegex, (_, children) => {
      let headers: TableHeader[] = [];
      const columns: string[] = [];

      const tableHeaderRegex =
        /<pia-laboratory-result-table-header title="(.*?)" attributeName="(.*?)"><\/pia-laboratory-result-table-header>/gs;
      let headerMatch: RegExpExecArray | null;
      while ((headerMatch = tableHeaderRegex.exec(children)) !== null) {
        headers.push({ title: headerMatch[1], attributeName: headerMatch[2] });
      }

      const tableEntryRegex =
        /<pia-laboratory-result-table-entry name="(.*?)"><\/pia-laboratory-result-table-entry>/gs;

      let columnMatch: RegExpExecArray | null;
      while ((columnMatch = tableEntryRegex.exec(children)) !== null) {
        columns.push(columnMatch[1]);
      }

      if (headers.length === 0) {
        headers = [
          { title: 'PCR', attributeName: 'key' },
          { title: 'Ergebnis', attributeName: '.result' },
          { title: 'Analysis Datum', attributeName: '.date_of_analysis' },
          { title: 'Eingang der Probe', attributeName: '.date_of_delivery' },
          {
            title: 'Datum der Ergebnismitteilung',
            attributeName: '.date_of_announcement',
          },
        ];
      }

      const headersWithTags = headers
        .map((header) => `<th>${header.title}</th>`)
        .join('');

      const columnsWithTags = columns
        .map(
          (column) =>
            `<tr>${headers
              .map(
                (header) =>
                  `<td>${
                    header.attributeName === 'key'
                      ? column
                      : `${column}${header.attributeName}`
                  }</td>`
              )
              .join('')}</tr>`
        )
        .join('');

      return `<table class="pia-laboratory-result-table"><tr>${headersWithTags}</tr>${columnsWithTags}</table>`;
    });
  };

  public async publish(): Promise<void> {
    if (this.hasContentChanged()) {
      this.dialogRef.close(this.transformImages(this.text));
    }
  }

  public hasContentChanged() {
    return this.text !== this.data.initialText;
  }

  public insertTag(tag: string) {
    this.markdownEditor.insertTextAtCurrentSelection(tag);
  }

  public insertTable() {
    const headerTags = this.tableHeaders
      .map(
        (tableHeader) =>
          `<pia-laboratory-result-table-header title="${tableHeader.title}" attributeName="${tableHeader.attributeName}"></pia-laboratory-result-table-header>`
      )
      .reduce(
        (previous, tag, index) => (index === 0 ? tag : `${previous}\n${tag}`),
        ''
      );

    const columnTags = this.tableColumns
      .map(
        (tableColumn) =>
          `<pia-laboratory-result-table-entry name="${tableColumn}"></pia-laboratory-result-table-entry>`
      )
      .reduce(
        (previous, tag, index) => (index === 0 ? tag : `${previous}\n${tag}`),
        ''
      );

    const tableTag = `
<pia-laboratory-result-table>
${headerTags}
${columnTags}
</pia-laboratory-result-table>
`;
    this.markdownEditor.insertTextAtCurrentSelection(tableTag);
  }

  removeHeaderAtIndex(index: number) {
    this.tableHeaders.splice(index, 1);
  }

  removeColumnAtIndex(index: number) {
    this.tableColumns.splice(index, 1);
  }

  addTableHeader() {
    this.tableHeaders.push({
      title: this.headerTitle,
      attributeName: this.headerAttributeName,
    });
  }

  addTableColumn() {
    this.tableColumns.push(this.tableColumn);
  }

  openFileExplorer() {
    this.fileInputRef.nativeElement.click();
  }

  dragOver(event: DragEvent) {
    event.preventDefault();
    if (this.isDragNDropHovered !== true) {
      this.isDragNDropHovered = true;
    }
  }

  dragLeave(_event: DragEvent) {
    if (this.isDragNDropHovered !== false) {
      this.isDragNDropHovered = false;
    }
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) {
      this.imageToInsert = selectedFile;
    }
  }

  handleFileInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const selectedFile = inputElement.files?.[0];
    if (selectedFile) {
      this.imageToInsert = selectedFile;
    }
  }

  async insertImage() {
    if (this.imageToInsert) {
      const formData = new FormData();
      formData.append('file', this.imageToInsert);

      const imageInBase64: string = await this.convertImageToBase64(
        this.imageToInsert
      );

      this.imagesAsBase64[this.numberOfImages] = imageInBase64;
      const imageTag = `<img src="![${this.numberOfImages}]" alt="${this.imageToInsert.name}" width="180">`;

      this.markdownEditor.insertTextAtCurrentSelection(imageTag);
      this.numberOfImages++;
    }
  }

  private convertImageToBase64(file: File): Promise<string> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
