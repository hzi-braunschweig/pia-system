/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  ElementRef,
  ViewChild,
  Directive,
  AfterViewInit,
  Input,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Observable } from 'rxjs';
import { AlertService } from '../../../_services/alert.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { StudyUsersDatabase } from '../../../_helpers/study-users-database';
import { TranslateService } from '@ngx-translate/core';
import { StudyUsersDataSource } from '../../../_helpers/study-users-data-source';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { DialogUserStudyAccessComponent } from '../../../dialogs/user-study-dialog/user-study-dialog';
import { DialogUserEditComponent } from '../../../dialogs/user-edit-dialog/user-edit-dialog';
import { Studie } from '../../../psa.app.core/models/studie';
import { MediaObserver } from '@angular/flex-layout';
import { forwardRef } from '@angular/core';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

@Component({
  templateUrl: 'study-accesses.component.html',
  styleUrls: ['study-accesses.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class StudyAccessesComponent implements OnInit {
  cols: Observable<number>;
  name: string;
  study: Studie = new Studie();
  constructor(
    private questionnaireService: QuestionnaireService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private _location: Location,
    private router: Router,
    private mediaObserver: MediaObserver,
    private auth: AuthenticationManager
  ) {
    if ('name' in this.activatedRoute.snapshot.params) {
      this.name = this.activatedRoute.snapshot.paramMap.get('name');
    }

    const grid = new Map([
      ['xs', 2],
      ['sm', 3],
      ['md', 3],
      ['lg', 5],
      ['xl', 5],
    ]);
    let start: any;

    grid.forEach((cols, mqAlias) => {
      if (this.mediaObserver.isActive(mqAlias)) {
        start = cols;
      }
    });

    this.cols = this.mediaObserver.media$
      .map((change) => grid.get(change.mqAlias))
      .startWith(start);
  }

  displayedColumns = ['user_id', 'study_id', 'role', 'access_level', 'edit'];
  studyUsersDatabase: StudyUsersDatabase | null;
  dataSource: StudyUsersDataSource | null;
  @ViewChild(MatPaginator, { static: true }) _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngOnInit(): void {
    this.studyUsersDatabase = new StudyUsersDatabase(
      this.questionnaireService,
      this.alertService,
      this.name
    );
    this.dataSource = new StudyUsersDataSource(
      this.studyUsersDatabase,
      this._paginator,
      this.sort
    );
    this.questionnaireService.getStudy(this.name).then(
      (result: any) => {
        this.study = result;
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }

  canCurrentRoleAddProbands(): boolean {
    return this.auth.currentRole === 'SysAdmin';
  }

  backClicked(): void {
    this._location.back();
  }

  openDialog(username: string, study_id: string): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: { data: ' 	den Nutzer ' + username + ' aus Studie ' + study_id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.studyUsersDatabase.deleteUserFromStudy(username, study_id);
      }
    });
  }

  postStudyAccess(): void {
    const dialogRef = this.dialog.open(DialogUserStudyAccessComponent, {
      width: '700px',
      data: { data: this.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.studyUsersDatabase = new StudyUsersDatabase(
          this.questionnaireService,
          this.alertService,
          this.name
        );
        this.dataSource = new StudyUsersDataSource(
          this.studyUsersDatabase,
          this._paginator,
          this.sort
        );
        this.cdr.detectChanges();
      }
    });
  }

  editStudyAccess(user: object): void {
    const dialogRef = this.dialog.open(DialogUserEditComponent, {
      width: '500px',
      data: { data: this.name, user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.studyUsersDatabase = new StudyUsersDatabase(
          this.questionnaireService,
          this.alertService,
          this.name
        );
        this.dataSource = new StudyUsersDataSource(
          this.studyUsersDatabase,
          this._paginator,
          this.sort
        );
        this.cdr.detectChanges();
      }
    });
  }
}

@Directive({
  selector: '[appShowColumn]',
})
export class ShowColumnDirective implements AfterViewInit {
  @Input() showInput: string;
  constructor(private elRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.elRef.nativeElement.style.display = this.showInput;
  }
}
