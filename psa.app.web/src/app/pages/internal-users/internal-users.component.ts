import { Component, ChangeDetectorRef, ViewChild, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { Router } from '@angular/router';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DialogUserDataComponent } from '../../_helpers/dialog-user-data';
import { InternalUsersDatabase } from '../../_helpers/internal-users-database';
import { InternalUsersDataSource } from '../../_helpers/internal-users-data-source';
import { DialogNewUserComponent } from '../../dialogs/new-user-dialog/new-user-dialog.component';
import { MediaObserver } from '@angular/flex-layout';
import { Observable } from 'rxjs';
import { forwardRef } from '@angular/core';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';

@Component({
  templateUrl: 'internal-users.component.html',
  styleUrls: ['internal-users.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class InternalUsersComponent implements OnInit {
  roles = [
    { value: 'Forscher', viewValue: 'ROLES.RESEARCHER' },
    { value: 'ProbandenManager', viewValue: 'ROLES.PROBANDS_MANAGER' },
    { value: 'EinwilligungsManager', viewValue: 'ROLES.COMPLIANCE_MANAGER' },
    { value: 'Untersuchungsteam', viewValue: 'ROLES.RESEARCH_TEAM' },
  ];
  public cols: Observable<number>;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private translate: TranslateService,
    private router: Router,
    private mediaObserver: MediaObserver,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    const gridAns = new Map([
      ['xs', 1],
      ['sm', 2],
      ['md', 3],
      ['lg', 4],
      ['xl', 4],
    ]);
    let startCond2: number;
    gridAns.forEach((cols, mqAlias) => {
      if (this.mediaObserver.isActive(mqAlias)) {
        startCond2 = cols;
      }
    });
    this.cols = this.mediaObserver.media$
      .map((change) => gridAns.get(change.mqAlias))
      .startWith(startCond2);
  }

  displayedColumns = ['username', 'role', 'first_logged_in_at', 'view'];
  internalUsersDatabase = new InternalUsersDatabase(
    this.authService,
    this.alertService
  );
  dataSource: InternalUsersDataSource | null;
  selection = new SelectionModel<string>(true, []);
  @ViewChild(MatPaginator, { static: true }) _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  currentRole: string;
  filterKeyword: string;
  usersWithStudyAccess: UserWithStudyAccess[];
  isLoading: boolean = true;

  ngOnInit(): void {
    this.dataSource = new InternalUsersDataSource(
      this.internalUsersDatabase,
      this._paginator,
      this.sort
    );

    this.authService.getUsers().then(
      (result: any) => {
        this.usersWithStudyAccess = result.users;
        this.usersWithStudyAccess.forEach((proband, probandIndex) => {
          if (proband.first_logged_in_at != null) {
            proband.first_logged_in_at = new Date(
              proband.first_logged_in_at
            ).toLocaleDateString();
          }
        });
        this.dataSource.insertData([]);
        this.isLoading = false;
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
    this.cdr.detectChanges();
    this.filterKeyword = '';
  }

  filterSelectMethod(): void {
    if (!this.dataSource) {
      return;
    }
    if (this.dataSource.renderedData.length === 0) {
      this.dataSource.insertData(this.usersWithStudyAccess);
    }
    this.dataSource.filter = this.currentRole;
  }

  applyFilter(): void {
    this.dataSource.filter = this.filterKeyword.trim().toLowerCase();
  }

  resetFilter(): void {
    this.dataSource.insertData([]);
    this.dataSource.filter = '';
    this.currentRole = undefined;
    this.filterKeyword = '';
  }

  addUser(): void {
    const dialogRef = this.dialog.open(DialogNewUserComponent, {
      width: '700px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.internalUsersDatabase = new InternalUsersDatabase(
          this.authService,
          this.alertService
        );
        this.dataSource = new InternalUsersDataSource(
          this.internalUsersDatabase,
          this._paginator,
          this.sort
        );
        this.cdr.detectChanges();
        this.dialog.open(DialogUserDataComponent, {
          width: '500px',
          data: result,
        });
      }
    });
  }

  openDialog(username: string): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: { data: 'den Nutzer ' + username },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.internalUsersDatabase.deleteUser(username);
      }
    });
  }
}
