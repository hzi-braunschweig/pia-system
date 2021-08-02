/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticationManager } from './_services/authentication-manager.service';
import { FCMService } from './_services/fcm.service';
import { Router } from '@angular/router';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { LocaleService } from './_services/locale.service';
import { environment } from '../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  isLtMd: boolean;

  constructor(
    private fcmService: FCMService,
    private auth: AuthenticationManager,
    private localeService: LocaleService,
    private router: Router,
    private titleService: Title,
    private mediaObserver: MediaObserver,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.mediaObserver
      .asObservable()
      .subscribe((mediaChange: MediaChange[]) => {
        this.isLtMd =
          mediaChange.map((value) => value.mqAlias).indexOf('lt-md') > -1;
      });
  }

  ngOnInit(): void {
    if (environment.isDevelopmentSystem) {
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
    this.titleService.setTitle('PIA Web App');
  }

  get navigationVisible(): boolean {
    return (
      !this.router.url.includes('/login') &&
      !this.router.url.includes('changePassword')
    );
  }

  get navigationMode(): 'over' | 'push' | 'side' {
    return this.isLtMd ? 'over' : 'side';
  }
}
