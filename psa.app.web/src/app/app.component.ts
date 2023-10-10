/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { FCMService } from './_services/fcm.service';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { LocaleService } from './_services/locale.service';
import { environment } from '../environments/environment';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public isLoading: boolean = true;
  public isLtMd: boolean;

  constructor(
    private fcmService: FCMService,
    private localeService: LocaleService,
    private mediaObserver: MediaObserver,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.isLoading = false;
    this.mediaObserver
      .asObservable()
      .subscribe((mediaChanges: MediaChange[]) => {
        this.isLtMd = mediaChanges.some((change) => change.mqAlias === 'lt-md');
      });

    if (environment.isDevelopmentSystem && !environment.isE2ETestSystem) {
      console.warn('we are running on a development system!');
      this.translate
        .get('SYSTEM.IS_DEVELOPMENT_SYSTEM')
        .pipe(first())
        .subscribe((message) => {
          this.snackBar.open(message, 'X', {
            panelClass: ['error'],
            duration: 10000,
          });
        });
    }
  }

  public get navigationMode(): 'over' | 'push' | 'side' {
    return this.isLtMd ? 'over' : 'side';
  }
}
