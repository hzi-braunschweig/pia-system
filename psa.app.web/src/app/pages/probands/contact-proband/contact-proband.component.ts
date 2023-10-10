/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { NotificationService } from '../../../psa.app.core/providers/notification-service/notification-service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CurrentUser } from '../../../_services/current-user.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { filter } from 'rxjs/operators';

interface EmailRequestForm {
  recipients: FormControl<string[] | undefined[]>;
  title: FormControl<string>;
  body: FormControl<string>;
}

@Component({
  selector: 'app-contact-proband',
  templateUrl: './contact-proband.component.html',
  styleUrls: ['./contact-proband.component.scss'],
})
export class ContactProbandComponent implements OnInit {
  public isChildWindow = false;

  public studyName = new FormControl(null, [Validators.required]);

  public message = new FormGroup<EmailRequestForm>({
    recipients: new FormControl([], [Validators.required]),
    title: new FormControl('', [Validators.required]),
    body: new FormControl('', [Validators.required]),
  });

  public notifyByEmail = new FormControl(false);
  public notifyByNotification = new FormControl(false);

  public allPseudonyms = [];

  constructor(
    public currentUser: CurrentUser,
    private probandService: ProbandService,
    private matDialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private notificationService: NotificationService
  ) {
    if (this.activatedRoute.snapshot.paramMap.has('usernames')) {
      this.message
        .get('recipients')
        .setValue(
          this.activatedRoute.snapshot.paramMap.get('usernames').split(';')
        );
      this.notifyByEmail.setValue(true);
      this.isChildWindow = true;
    }
  }

  public async ngOnInit(): Promise<void> {
    this.studyName.valueChanges
      .pipe(filter(Boolean))
      .subscribe(async (studyName) => {
        this.allPseudonyms = (await this.probandService.getProbands(studyName))
          .filter((user) => user.status === 'active')
          .map((user) => user.pseudonym);
      });
  }

  public async onSubmit(): Promise<void> {
    let dialogMessage;
    if (this.message.get('recipients').value.length === 0) {
      dialogMessage = 'CONTACT_PROBAND.RECIPIENT_IS_REQUIRED';
    } else if (this.message.get('title').invalid) {
      dialogMessage = 'CONTACT_PROBAND.SUBJECT_IS_REQUIRED';
    } else if (this.message.get('body').invalid) {
      dialogMessage = 'CONTACT_PROBAND.ENTER_MESSAGE_WARNING';
    }
    if (dialogMessage) {
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: dialogMessage,
          isSuccess: false,
        },
      });
      return;
    }
    this.message.disable();

    if (this.notifyByNotification.value) {
      await this.sendNotification();
    }
    if (this.notifyByEmail.value) {
      await this.sendMail();
    }

    this.message.enable();
    this.resetValues();
  }

  private async sendNotification(): Promise<void> {
    try {
      await this.notificationService.sendNotification(
        this.message.getRawValue()
      );
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'CONTACT_PROBAND.NOTIFICATIONS_SENT',
          values: {
            probanden: this.message.get('recipients').getRawValue().join(',\n'),
          },
          isSuccess: true,
        },
      });
    } catch (err) {
      console.log(err);
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLE_MANAGEMENT.ERROR_MATERIAL_REQUEST',
          isSuccess: false,
        },
      });
    }
  }

  private async sendMail(): Promise<void> {
    try {
      const emailRecipients = await this.notificationService.sendEmail(
        this.message.getRawValue()
      );

      if (emailRecipients.length <= 0) {
        this.matDialog.open(DialogPopUpComponent, {
          width: '500px',
          data: {
            data: '',
            content: 'CONTACT_PROBAND.NO_EMAILS_SENT',
            isSuccess: false,
          },
        });
      } else {
        const mailsSentToText = emailRecipients
          .map(
            (recepient) => recepient.pseudonym + ' (' + recepient.email + ')'
          )
          .join(',\n');

        this.matDialog.open(DialogPopUpComponent, {
          width: '500px',
          data: {
            data: '',
            content: 'CONTACT_PROBAND.EMAILS_SENT',
            values: { probanden: mailsSentToText },
            isSuccess: true,
          },
        });
      }
    } catch (err) {
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLE_MANAGEMENT.ERROR_MATERIAL_REQUEST',
          isSuccess: false,
        },
      });
    }
  }

  private resetValues(): void {
    this.notifyByEmail.reset(false);
    this.notifyByNotification.reset(false);
    this.message.reset({
      recipients: [],
      title: '',
      body: '',
    });
  }

  goBackInHistory(): void {
    this.location.back();
  }
}
