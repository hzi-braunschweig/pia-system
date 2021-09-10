/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslatedUser } from './translated-user/translated-user.model';
import { TranslatedUserFilter } from './translated-user/translated-user-filter';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { TranslatedUserFactory } from './translated-user/translated-user.factory';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';

export interface ProbandsListEntryActionConfig {
  columnName: string;
  header: string;
  buttons: ProbandsListEntryActionButtonConfig[];
}

export interface ProbandsListEntryActionButtonConfig {
  label: string;
  icon: string;
  disableForDeletedAccounts: boolean;
  showOnlyForIdAndUsernameEquality: boolean;
  showOnlyForIdAndUsernameInequality: boolean;
  eventEmitter: EventEmitter<UserWithStudyAccess>;
}

/**
 * Displays a list of probands with filters and possibility to configure
 * actions for the whole table or single entries.
 *
 * May also be used within the ProbandsComponent with slight changes.
 */
@Component({
  selector: 'app-probands-list',
  templateUrl: './probands-list.component.html',
  styleUrls: ['probands-list.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class ProbandsListComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  sort: MatSort;

  @Input()
  displayedColumns = [
    'username',
    'ids',
    'studyNamesArray',
    'is_test_proband',
    'first_logged_in_at',
    'account_status',
  ];

  // tslint:disable-next-line:no-output-rename
  @Output('isLoading')
  isLoadingEvent = new EventEmitter<boolean>();

  isLoading: boolean = true;

  dataSource: MatTableDataSource<TranslatedUser> =
    new MatTableDataSource<TranslatedUser>([]);

  studyFilterValues: string[] = [];

  activeFilter: TranslatedUserFilter = new TranslatedUserFilter();

  entryActions: Map<string, ProbandsListEntryActionConfig> = new Map<
    string,
    ProbandsListEntryActionConfig
  >();

  constructor(
    private readonly authService: AuthService,
    private readonly alertService: AlertService,
    private readonly translatedUserFactory: TranslatedUserFactory
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  /**
   * Let's Child Components register a new column
   * @param entryActionConfig ProbandsListEntryActionConfig
   */
  updateEntryAction(entryActionConfig: ProbandsListEntryActionConfig): void {
    if (!this.displayedColumns.includes(entryActionConfig.columnName)) {
      this.displayedColumns.push(entryActionConfig.columnName);
    }
    this.entryActions.set(entryActionConfig.columnName, entryActionConfig);
  }

  /**
   * Asures that the filter will be updated within the data source
   * and the page is reset to the first page
   */
  updateFilter(): void {
    this.dataSource.filter = this.activeFilter.filterKey;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isShown(
    user: UserWithStudyAccess,
    buttonConfig: ProbandsListEntryActionButtonConfig
  ): boolean {
    return (
      (!buttonConfig.showOnlyForIdAndUsernameEquality &&
        !buttonConfig.showOnlyForIdAndUsernameInequality) ||
      (buttonConfig.showOnlyForIdAndUsernameEquality &&
        user.ids === user.username) ||
      (buttonConfig.showOnlyForIdAndUsernameInequality &&
        user.ids !== user.username)
    );
  }

  isDisabled(
    user: UserWithStudyAccess,
    buttonConfig: ProbandsListEntryActionButtonConfig
  ): boolean {
    return (
      buttonConfig.disableForDeletedAccounts &&
      user.account_status === 'deactivated'
    );
  }

  /**
   * Configure DataSource. Has to be done on init as ViewChilds need to be available.
   */
  async fetchUsers(): Promise<void> {
    this.isLoading = true;
    this.isLoadingEvent.emit(this.isLoading);
    try {
      const response = await this.authService.getUsers();
      this.studyFilterValues = this.extractStudyFilterValues(response.users);
      this.dataSource.data = response.users.map((user) =>
        this.translatedUserFactory.create(user)
      );
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (data) =>
        this.activeFilter.filter(data);
      this.updateFilter();
    } catch (error) {
      this.alertService.errorObject(error);
    }
    this.isLoading = false;
    this.isLoadingEvent.emit(false);
  }

  /**
   * Extracts all unique study names from the user list
   *
   * @param users users from which the study name will be extracted
   */
  private extractStudyFilterValues(users: UserWithStudyAccess[]): string[] {
    return Array.from(
      new Set(
        this.flattenArray(
          users.map((user) =>
            user.study_accesses.map((access) => access.study_id)
          )
        )
      )
    );
  }

  private flattenArray<T>(array: T[][]): T[] {
    return [].concat.apply([], array);
  }
}
