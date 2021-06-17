import { Component, forwardRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LoggingService } from 'src/app/psa.app.core/providers/logging-service/logging-service';
import { TranslateService } from '@ngx-translate/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../../_helpers/date-adapter';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';
import { endOfDay, startOfDay } from 'date-fns';
import {
  SystemLog,
  SystemLogFilter,
  SystemLogType,
} from '../../psa.app.core/models/systemLog';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

interface SystemLogTableEntry {
  requestedBy: string;
  requestedFor: string;
  timestamp: Date;
  type: string;
}

@Component({
  templateUrl: 'logsDelete-sysAdmin.component.html',
  styleUrls: ['logsDelete-sysAdmin.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de' },
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
    TranslateService,
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class LogsDeleteSysAdminComponent {
  form: FormGroup = new FormGroup({
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    types: new FormControl(null, Validators.required),
  });
  currentDate = new Date();
  loading = false;
  displayedColumns = ['requestedBy', 'requestedFor', 'timestamp', 'type'];
  dataSource = new MatTableDataSource<SystemLogTableEntry>();
  showTable = false;
  readonly types = new Map<SystemLogType, string>([
    ['sample', 'LOGS_DELETE.SAMPLE_DELETED'],
    ['partial', 'LOGS_DELETE.PARTIAL_DELETED'],
    ['study', 'LOGS_DELETE.STUDY_DELETED'],
    ['study_change', 'LOGS_DELETE.STUDY_CHANGED'],
    ['proband', 'LOGS_DELETE.PROBAND_DELETED'],
    ['personal', 'LOGS_DELETE.CONTACT_PROBAND_DELETED'],
    ['compliance', 'LOGS_DELETE.COMPLIANCE_CHANGED'],
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private loggingService: LoggingService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) matSort: MatSort;

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  private updateLogTable(newData: SystemLogTableEntry[]): void {
    this.dataSource = new MatTableDataSource(newData);
    this.dataSource.sort = this.matSort;
    this.loading = false;
    this.dataSource.paginator = this.paginator;
  }

  private generateQueryFromForm(): SystemLogFilter {
    const query: SystemLogFilter = {
      types: this.form
        .get('types')
        .value.filter((item) => item !== 'alltypesCheckbox'),
    };
    if (this.form.get('start_date').value) {
      query.fromTime = startOfDay(
        new Date(this.form.get('start_date').value)
      ).toISOString();
    }
    if (this.form.get('end_date').value) {
      query.toTime = endOfDay(
        new Date(this.form.get('end_date').value)
      ).toISOString();
    }
    return query;
  }

  onDateRangeChanged(event: MatDatepickerInputEvent<Date>): void {
    const start = this.form.get('start_date').value;
    const end = this.form.get('end_date').value;
    if (end && start && end < start) {
      this.form.get('start_date').setValue(event.value);
      this.form.get('end_date').setValue(event.value);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) {
      return;
    }
    this.loading = true;
    const query = this.generateQueryFromForm();

    try {
      const data: SystemLog[] = await this.loggingService.getSystemLogs(query);
      const systemLogs = data.map((systemLog: SystemLog) => {
        return {
          ...systemLog,
          type: this.types.get(systemLog.type),
        };
      });
      this.showTable = true;
      this.updateLogTable(systemLogs);
    } catch (e) {
      this.showFailDialog({
        content: 'LOGS_DELETE.ERROR_STUDY',
        isSuccess: false,
      });
    }
    this.loading = false;
  }

  private showFailDialog(dataError): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '250px',
      data: dataError,
    });
  }

  onSelectAllTypesClicked(): void {
    const typesArray = [];
    if (this.form.get('types').value[0] === 'alltypesCheckbox') {
      typesArray.push('alltypesCheckbox');
      typesArray.push(...this.types.keys());
    }
    this.form.get('types').setValue(typesArray);
  }
}
