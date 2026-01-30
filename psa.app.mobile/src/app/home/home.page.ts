/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { CurrentUser } from '../auth/current-user.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import {
  IonContent,
  IonCard,
  IonCardContent,
  Platform,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    HeaderComponent,
    IonContent,
    NgIf,
    IonCard,
    IonCardContent,
    MarkdownComponent,
    TranslateModule,
  ],
})
export class HomePage implements OnInit {
  public androidLink =
    'https://play.google.com/store/apps/details?id=de.pia.app';
  public iOSLink =
    'https://apps.apple.com/de/app/pia-epidemiologie/id1510929221';
  public welcomeText: string;

  constructor(
    public platform: Platform,
    private questionnaireClient: QuestionnaireClientService,
    private currentUser: CurrentUser
  ) {}

  async ngOnInit() {
    const welcomeTextObj = await this.questionnaireClient.getStudyWelcomeText(
      this.currentUser.study
    );
    if (welcomeTextObj) {
      this.welcomeText = welcomeTextObj.welcome_text;
    }
  }
}
