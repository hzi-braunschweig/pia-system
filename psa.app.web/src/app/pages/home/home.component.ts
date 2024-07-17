/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { NotificationService } from 'src/app/psa.app.core/providers/notification-service/notification-service';
import { NotificationPresenter } from '../../_services/notification-presenter.service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { CurrentUser } from '../../_services/current-user.service';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public androidLink =
    'https://play.google.com/store/apps/details?id=de.pia.app';
  public iOSLink =
    'https://apps.apple.com/de/app/pia-epidemiologie/id1510929221';
  public welcomeText: string;

  constructor(
    public readonly user: CurrentUser,
    private readonly activatedRoute: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly notification: NotificationPresenter,
    private readonly router: Router
  ) {
    // this "redirect" is needed as a fallback as long as probands and professionals share the same app
    if (this.user.isProfessional()) {
      this.router.navigate(['study']);
    }
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.queryParams
      .pipe(filter((params) => params.notification_id))
      .subscribe((params) => this.presentNotification(params.notification_id));

    this.welcomeText = (
      await this.questionnaireService.getStudyWelcomeText(this.user.study)
    )?.welcome_text;
  }

  public async presentNotification(notificationId: string): Promise<void> {
    try {
      const notification = await this.notificationService.getNotificationById(
        notificationId
      );
      this.notification.present(notification);
    } catch (err) {
      console.log('Could not load notification with id:', notificationId, err);
    }
  }
}
