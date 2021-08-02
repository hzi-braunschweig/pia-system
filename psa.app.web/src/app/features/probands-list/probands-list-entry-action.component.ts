/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  EventEmitter,
  forwardRef,
  Host,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  ProbandsListComponent,
  ProbandsListEntryActionButtonConfig,
} from './probands-list.component';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';

@Component({
  selector: 'app-probands-list-entry-action-button',
  template: ``,
})
export class ProbandsListEntryActionButtonComponent implements OnChanges {
  @Input()
  actionId: string;

  @Input()
  actionLabel: string;

  @Input()
  actionIcon = 'visibility';

  @Input()
  disableForDeletedAccounts = false;

  @Input()
  showOnlyForIdAndUsernameEquality = false;

  @Input()
  showOnlyForIdAndUsernameInequality = false;

  // tslint:disable-next-line:no-output-native
  @Output()
  click: EventEmitter<UserWithStudyAccess> = new EventEmitter<UserWithStudyAccess>();

  constructor(
    @Inject(forwardRef(() => ProbandsListEntryActionComponent))
    private parent: ProbandsListEntryActionComponent
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('actionLabel' in changes) {
      this.parent.addEntryActionButton(this.actionId, {
        label: this.actionLabel,
        icon: this.actionIcon,
        disableForDeletedAccounts: this.disableForDeletedAccounts,
        showOnlyForIdAndUsernameEquality: this.showOnlyForIdAndUsernameEquality,
        showOnlyForIdAndUsernameInequality:
          this.showOnlyForIdAndUsernameInequality,
        eventEmitter: this.click,
      });
    }
  }
}

@Component({
  selector: 'app-probands-list-entry-action',
  template: ``,
})
export class ProbandsListEntryActionComponent {
  @Input()
  columnName: string;

  @Input()
  actionHeader: string;

  private buttons = new Map<string, ProbandsListEntryActionButtonConfig>();

  constructor(@Host() private readonly parent: ProbandsListComponent) {}

  addEntryActionButton(
    actionId: string,
    buttonConfig: ProbandsListEntryActionButtonConfig
  ): void {
    this.buttons.set(actionId, buttonConfig);

    this.parent.updateEntryAction({
      columnName: this.columnName,
      header: this.actionHeader,
      buttons: Array.from(this.buttons.values()),
    });
  }
}
