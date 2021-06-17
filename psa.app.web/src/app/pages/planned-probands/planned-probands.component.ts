import {
  Component,
  ElementRef,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { JwtHelperService } from '@auth0/angular-jwt';
import { PlannedProband } from '../../psa.app.core/models/plannedProband';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DataService } from '../../_services/data.service';
import { Observable } from 'rxjs';
import { User } from 'src/app/psa.app.core/models/user';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import 'datejs';
import { DialogNewPlannedProbandsComponent } from 'src/app/dialogs/new-planned-probands-dialog/new-planned-probands-dialog.component';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';
import { forwardRef } from '@angular/core';
import { StudyAccess } from 'src/app/psa.app.core/models/study_access';

@Component({
  selector: 'app-planned-probands',
  templateUrl: './planned-probands.component.html',
  styleUrls: ['./planned-probands.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class PlannedProbandsComponent implements OnInit {
  currentRole: string;
  dataSource: MatTableDataSource<PlannedProband>;
  plannedProbands: PlannedProband[] = [];

  displayedColumns = [
    'select',
    'user_id',
    'study_id',
    'activated_at',
    'delete',
  ];
  selection = new SelectionModel<any>(true, []);
  @ViewChild('filter', { static: true }) filter: ElementRef;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  needsMaterialFilterCheckbox: any;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    public dialog: MatDialog
  ) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    // decode the token to get its payload
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.authService.getPlannedProbands().then((results: PlannedProband[]) => {
      this.plannedProbands = results;
      this.setPlannedProbandsStatus();
      this.setPlannedProbandsStudies();
      this.dataSource = new MatTableDataSource(this.plannedProbands);
      this.isLoading = false;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      Observable.fromEvent(this.filter.nativeElement, 'keyup')
        .debounceTime(150)
        .distinctUntilChanged()
        .subscribe(() => {
          if (!this.dataSource) {
            return;
          }
          this.dataSource.filter = this.filter.nativeElement.value;
        });
      this.cdr.detectChanges();
    });
  }

  setPlannedProbandsStatus(): void {
    this.plannedProbands.forEach((plannedProband: PlannedProband) => {
      plannedProband.activated_at = plannedProband.activated_at
        ? this.translate.instant('PLANNED_PROBANDS.ACTIVATED_AT') +
          new Date(plannedProband.activated_at).toString('dd.MM.yy HH:mm')
        : this.translate.instant('PLANNED_PROBANDS.IN_PLANNING');
    });
  }

  setPlannedProbandsStudies(): void {
    this.plannedProbands.forEach((plannedProband: PlannedProband) => {
      plannedProband.studies = plannedProband.study_accesses
        .map((access: StudyAccess) => access.study_id)
        .toString();
    });
  }

  filterSelectMethod(): void {
    if (!this.dataSource) {
      return;
    }
  }

  resetFilter(): void {
    this.dataSource.filter = '';
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.filteredData.forEach((row) =>
          this.selection.select(row)
        );
  }

  createLetters(plannedProbands?: PlannedProband[]): void {
    const forPlannedProbands = plannedProbands
      ? plannedProbands
      : this.selection.selected;
    if (forPlannedProbands.length > 0) {
      this.dataService.setPlannedProbandsForLetters(forPlannedProbands);
      this.router.navigate(['/collective-login-letters']);
    }
  }

  addPlannedProbands(): void {
    const dialogRef = this.dialog.open(DialogNewPlannedProbandsComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createLetters(result);
      } else {
        this.loadData();
      }
    });
  }

  openDeleteDialog(user_id: string): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: { data: 'den geplanten Probanden ' + user_id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.authService.deletePlannedProband(user_id).then(() => {
          this.loadData();
        });
      }
    });
  }
}
