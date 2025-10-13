/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { environment } from '../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  public isLoading: boolean = true;
  public isLtMd: boolean;

  constructor(
    private readonly mediaObserver: MediaObserver,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService
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
            panelClass: ['snack-bar-error'],
            duration: 10000,
          });
        });
    }
  }

  public get navigationMode(): 'over' | 'push' | 'side' {
    return this.isLtMd ? 'over' : 'side';
  }
}
