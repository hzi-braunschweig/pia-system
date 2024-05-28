/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { EventHistorySettingsForm } from './event-history-settings-form';
import { validateRetentionTime } from './validate-retention-time';
import { filter, map } from 'rxjs/operators';
import { AlertService } from '../../../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { MatDialog } from '@angular/material/dialog';
import { DialogOkCancelComponent } from '../../../_helpers/dialog-ok-cancel';
import { EventHistorySettingsDto } from './event-history-settings.dto';
import { Observable, of, switchMap } from 'rxjs';
import { EventHistorySettingsService } from './event-history-settings.service';

@Component({
  selector: 'app-event-history-settings',
  templateUrl: './event-history-settings.component.html',
  styleUrls: ['./event-history-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventHistorySettingsComponent implements OnInit {
  @Output()
  public readonly loading = new EventEmitter<boolean>();
  public config: EventHistorySettingsDto | null = null;
  public formGroup: FormGroup<EventHistorySettingsForm> =
    new FormGroup<EventHistorySettingsForm>(
      {
        active: new FormControl(false),
        retentionTimeInDays: new FormControl(0),
      },
      validateRetentionTime
    );

  public constructor(
    private readonly settingsService: EventHistorySettingsService,
    private readonly alertService: AlertService,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService
  ) {}

  public ngOnInit(): void {
    this.loading.emit(true);
    this.settingsService.get().subscribe({
      next: (config) => {
        this.setCurrentConfig(config);
      },
      error: (err) => {
        this.alertService.errorObject(
          err,
          this.translate.instant('EVENT_HISTORY.LOAD_FAILED')
        );
      },
      complete: () => {
        this.loading.emit(false);
      },
    });
  }

  public save(): void {
    if (this.formGroup.invalid) {
      return;
    }

    this.loading.emit(true);

    this.confirmDeactivation()
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.settingsService.post(this.formGroup.value))
      )
      .subscribe({
        next: (config) => {
          this.setCurrentConfig(config);
          this.dialog.open(DialogPopUpComponent, {
            width: '500px',
            data: {
              content: 'EVENT_HISTORY.SAVE_SUCCESS',
              isSuccess: true,
            },
          });
        },
        error: (err) => {
          console.log(err);
          this.dialog.open(DialogPopUpComponent, {
            width: '500px',
            data: {
              content: 'EVENT_HISTORY.SAVE_FAILED',
              isSuccess: false,
            },
          });
        },
        complete: () => {
          this.loading.emit(false);
        },
      });
  }

  private setCurrentConfig(config: EventHistorySettingsDto): void {
    this.config = config;
    this.formGroup.setValue(config);
  }

  private confirmDeactivation(): Observable<boolean> {
    if (this.activeHasChangedToFalse()) {
      const dialog = this.dialog.open(DialogOkCancelComponent, {
        width: '500px',
        data: {
          q: 'EVENT_HISTORY.CONFIRM_DEACTIVATION_TITLE',
          content: 'EVENT_HISTORY.CONFIRM_DEACTIVATION_BODY',
        },
      });

      return dialog.afterClosed().pipe(map((result) => result === 'ok'));
    }

    return of(true);
  }

  private activeHasChangedToFalse(): boolean {
    return !this.formGroup.value.active && this.config.active;
  }
}
