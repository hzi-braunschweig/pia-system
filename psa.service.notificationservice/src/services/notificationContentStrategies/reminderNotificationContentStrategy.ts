/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationContentStrategy from './notificationContentStrategy';
import { QuestionnaireInstance } from '../../models/questionnaireInstance';
import { config } from '../../config';

export default class ReminderNotificationContentStrategy
  implements NotificationContentStrategy<QuestionnaireInstance>
{
  private readonly emailContent = {
    salutation: 'Liebe:r Nutzer:in,',
    linkText: 'PIA Webapp',
    linkToInstance:
      'Klicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:',
    linkToOverview:
      'Klicken Sie auf folgenden Link, um direkt zur Fragebogen-Übersicht zu gelangen:',
  };
  private readonly inAppContent = {
    openInstance:
      'Klicken Sie auf "Öffnen", um direkt zum Fragebogen zu gelangen.',
    openOverview:
      'Klicken Sie auf "Öffnen", um zur Fragebogen-Übersicht zu gelangen.',
  };
  private _instance: QuestionnaireInstance | null = null;

  private get instance(): QuestionnaireInstance | never {
    if (!this._instance) {
      throw Error('No questionnaire instance set');
    }

    return this._instance;
  }

  public initialize(instance: QuestionnaireInstance): void {
    this._instance = instance;
  }

  public getInAppTitle(): string {
    return this.instance.questionnaire.notificationTitle;
  }

  public getInAppText(): string {
    return (
      this.getBodyText() +
      '\n\n' +
      (this.instance.questionnaire.notificationLinkToOverview
        ? this.inAppContent.openOverview
        : this.inAppContent.openInstance)
    );
  }

  public getAdditionalData(): { linkToOverview: boolean } {
    return {
      linkToOverview: this.instance.questionnaire.notificationLinkToOverview,
    };
  }

  public getEmailContent(): { subject: string; text: string; html: string } {
    const { link, linkIntroduction } = this.getLinkContent();
    const content = `${
      this.emailContent.salutation
    }\n\n${this.getBodyText()}\n${linkIntroduction}\n${link}`;

    return {
      subject: this.instance.questionnaire.notificationTitle,
      text: content,
      html: content.replace(/\n/g, '<br>'),
    };
  }

  private getBodyText(): string {
    return this.instance.status === 'active'
      ? this.instance.questionnaire.notificationBodyNew
      : this.instance.questionnaire.notificationBodyInProgress;
  }

  private getLinkContent(): {
    link: string;
    linkIntroduction: string;
  } {
    let url = '';
    let linkIntroduction = '';

    if (this.instance.questionnaire.notificationLinkToOverview) {
      url = this.getUrlForOverview();
      linkIntroduction = this.emailContent.linkToOverview;
    } else {
      url = this.getUrlForQuestionnaireInstance(this.instance);
      linkIntroduction = this.emailContent.linkToInstance;
    }

    const link = `<a href='${url}'>${this.emailContent.linkText}</a>`;

    return { link, linkIntroduction };
  }

  private getUrlForQuestionnaireInstance(
    qInstance: QuestionnaireInstance
  ): string {
    return `${config.probandAppUrl}/extlink/questionnaire/${qInstance.questionnaire.id}/${qInstance.id}`;
  }

  private getUrlForOverview(): string {
    return `${config.probandAppUrl}/extlink/questionnaires/user`;
  }
}
