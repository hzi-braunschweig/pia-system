/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { NotificationService } from '../../../psa.app.core/providers/notification-service/notification-service';
import { ReplaySubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-contact-proband',
  templateUrl: './contact-proband.component.html',
  styleUrls: ['./contact-proband.component.scss'],
})
export class ContactProbandComponent implements OnInit {
  @ViewChild('pseudonymInput', { static: true })
  public pseudonymInput: ElementRef;

  public isChildWindow = false;
  public selectable = true;
  public removable = true;
  public submitButtonIsDisabled = false;

  public contactAll = false;
  public notifyByEmail = false;
  public notifyByNotification = false;

  public separatorKeysCodes = [ENTER, COMMA];

  public receiver = new FormControl('', [Validators.required]);
  public subject = new FormControl('', [Validators.required]);
  public content = new FormControl('', [Validators.required]);

  public messageFormGroup = new FormGroup({
    receiver: this.receiver,
    subject: this.subject,
    content: this.content,
  });

  public pseudonyms: string[] = [];

  public autoCompletePseudonyms: ReplaySubject<string[]> = new ReplaySubject<
    string[]
  >(1);

  private allPseudonyms = [];
  private autoCompletePseudonymsArray = [];
  private personalData = [];

  constructor(
    private translate: TranslateService,
    private auth: AuthService,
    private matDialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private personalDataService: PersonalDataService,
    private notificationService: NotificationService
  ) {
    if (this.activatedRoute.snapshot.paramMap.has('usernames')) {
      this.pseudonyms = this.activatedRoute.snapshot.paramMap
        .get('usernames')
        .split(';');
      this.notifyByEmail = true;
      this.isChildWindow = true;
    }
  }

  public async ngOnInit(): Promise<void> {
    // listen for search field value changes
    this.receiver.valueChanges.subscribe(() => {
      this.updateAutoCompletePseudonyms();
    });

    const res = await this.auth.getProbands();
    this.allPseudonyms = res
      .filter((user) => user.status === 'active')
      .map((user) => user.pseudonym);
    this.autoCompletePseudonymsArray = this.allPseudonyms;
    this.updateAutoCompletePseudonyms();
    this.personalData = await this.personalDataService.getPersonalDataAll();
  }

  filter(name: string): string[] {
    return this.allPseudonyms.filter(
      (pseudonym) => pseudonym.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  onSubmit(): void {
    if (this.pseudonyms.length === 0 && this.contactAll === false) {
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'CONTACT_PROBAND.RECIPIENT_IS_REQUIRED',
          isSuccess: false,
        },
      });
    } else if (this.messageFormGroup.get('subject').invalid) {
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'CONTACT_PROBAND.SUBJECT_IS_REQUIRED',
          isSuccess: false,
        },
      });
    } else if (this.messageFormGroup.get('content').invalid) {
      this.matDialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'CONTACT_PROBAND.ENTER_MESSAGE_WARNING',
          isSuccess: false,
        },
      });
    } else {
      this.disableAllElements();

      const requestData = {
        recipients: this.contactAll ? this.allPseudonyms : this.pseudonyms,
        title: this.messageFormGroup.get('subject').value,
        body: this.messageFormGroup.get('content').value,
      };

      if (this.notifyByNotification) {
        this.notificationService
          .sendNotification(requestData)
          .then(() => {
            this.matDialog.open(DialogPopUpComponent, {
              width: '500px',
              data: {
                data: '',
                content: 'CONTACT_PROBAND.NOTIFICATIONS_SENT',
                values: { probanden: requestData.recipients.join(',\n') },
                isSuccess: true,
              },
            });
          })
          .catch((err) => {
            console.log(err);
            this.matDialog.open(DialogPopUpComponent, {
              width: '500px',
              data: {
                data: '',
                content: 'SAMPLE_MANAGEMENT.ERROR_MATERIAL_REQUEST',
                isSuccess: false,
              },
            });
          })
          .finally(() => this.enableAllElements());
      }

      if (this.notifyByEmail) {
        this.notificationService
          .sendEmail(requestData)
          .then((emailAddresses) => {
            const mailsSentToText = this.personalData
              .filter((personalData) =>
                emailAddresses.includes(personalData.email)
              )
              .map(
                (personalData) =>
                  personalData.pseudonym + '(' + personalData.email + ')'
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
          })
          .catch((err) => {
            this.matDialog.open(DialogPopUpComponent, {
              width: '500px',
              data: {
                data: '',
                content: 'SAMPLE_MANAGEMENT.ERROR_MATERIAL_REQUEST',
                isSuccess: false,
              },
            });
          })
          .finally(() => {
            this.contactAll = false;
            this.notifyByEmail = false;
            this.notifyByNotification = false;
            this.enableAllElements();
          });
      }
    }
  }

  disableAllElements(): void {
    this.messageFormGroup.get('receiver').disable();
    this.messageFormGroup.get('subject').disable();
    this.messageFormGroup.get('content').disable();
    this.submitButtonIsDisabled = true;
    this.removable = false;
  }

  enableAllElements(): void {
    this.messageFormGroup.get('receiver').enable();
    this.messageFormGroup.get('subject').enable();
    this.messageFormGroup.get('content').enable();

    this.pseudonyms = [];
    this.messageFormGroup.get('subject').setValue('');
    this.messageFormGroup.get('content').setValue('');

    this.submitButtonIsDisabled = false;
    this.removable = true;
    this.updateAutoCompletePseudonyms();
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.pseudonyms.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.receiver.setValue(null);
  }

  remove(pseudonym: any): void {
    const index = this.pseudonyms.indexOf(pseudonym);

    if (index >= 0) {
      this.pseudonyms.splice(index, 1);
    }
    this.autoCompletePseudonymsArray.push(pseudonym);
    this.updateAutoCompletePseudonyms();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.pseudonyms.push(event.option.viewValue);
    const indexAutoComplete = this.autoCompletePseudonymsArray.indexOf(
      event.option.viewValue
    );
    if (indexAutoComplete >= 0) {
      this.autoCompletePseudonymsArray.splice(indexAutoComplete, 1);
    }
    this.pseudonymInput.nativeElement.value = '';
    this.receiver.setValue(null);
    this.pseudonymInput.nativeElement.blur();
    this.updateAutoCompletePseudonyms();
  }

  updateAutoCompletePseudonyms(): void {
    this.autoCompletePseudonyms.next(this.allPseudonyms);
    if (!this.autoCompletePseudonymsArray) {
      return;
    }
    // get the search keyword
    let search = this.pseudonymInput.nativeElement.value;
    if (!search) {
      this.autoCompletePseudonyms.next(
        this.autoCompletePseudonymsArray.slice()
      );
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the lab results
    this.autoCompletePseudonyms.next(
      this.autoCompletePseudonymsArray.filter((pseudonym) =>
        pseudonym.toLowerCase().includes(search)
      )
    );
  }

  goBackInHistory(): void {
    this.location.back();
  }
}
