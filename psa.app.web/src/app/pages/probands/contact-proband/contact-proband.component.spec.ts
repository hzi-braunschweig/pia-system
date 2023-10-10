/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ContactProbandComponent } from './contact-proband.component';
import { createProband } from '../../../psa.app.core/models/instance.helper.spec';
import { NotificationService } from '../../../psa.app.core/providers/notification-service/notification-service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CurrentUser } from '../../../_services/current-user.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('ContactProbandComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ContactProbandComponent;

  let currentUser: SpyObj<CurrentUser>;
  let probandService: SpyObj<ProbandService>;
  let notificationService: SpyObj<NotificationService>;
  let matDialog: SpyObj<MatDialog>;

  beforeEach(async () => {
    // Provider and Services
    currentUser = createSpyObj<CurrentUser>('CurrentUser', [], {
      studies: ['NAKO Test'],
    });
    probandService = createSpyObj<ProbandService>(['getProbands']);
    probandService.getProbands.and.resolveTo([
      createProband({ pseudonym: 'TestProband1' }),
      createProband({ pseudonym: 'TestProband2', status: 'deactivated' }),
    ]);
    notificationService = createSpyObj<NotificationService>([
      'sendNotification',
      'sendEmail',
    ]);
    notificationService.sendNotification.and.resolveTo(null);
    notificationService.sendEmail.and.resolveTo([
      {
        pseudonym: 'TestProband1',
        email: 'testproband1@example.com',
      },
    ]);
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);

    // Build Base Module
    await MockBuilder(ContactProbandComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: new Map([['usernames', 'TestProband1;TestProband2']]),
          },
        },
      })
      .mock(CurrentUser, currentUser)
      .mock(ProbandService, probandService)
      .mock(MatDialog, matDialog)
      .mock(NotificationService, notificationService);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component

    // Create component
    fixture = MockRender(ContactProbandComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should request available active probands of selected study for autocomplete', fakeAsync(() => {
    component.studyName.setValue('NAKO Test');
    tick();
    expect(probandService.getProbands).toHaveBeenCalledOnceWith('NAKO Test');
    expect(component.allPseudonyms).toEqual(['TestProband1']);
  }));

  it('should send notification request', fakeAsync(() => {
    component.notifyByNotification.setValue(true);
    component.message.get('recipients').setValue(['TestProband1']);
    component.message.get('title').setValue('Test Subject');
    component.message.get('body').setValue('Test Content');
    tick();

    component.onSubmit();

    expect(notificationService.sendNotification).toHaveBeenCalledOnceWith({
      recipients: ['TestProband1'],
      title: 'Test Subject',
      body: 'Test Content',
    });
  }));

  it('should send email notification request', fakeAsync(() => {
    component.notifyByEmail.setValue(true);
    component.message.get('recipients').setValue(['TestProband1']);
    component.message.get('title').setValue('Test Subject');
    component.message.get('body').setValue('Test Content');
    tick();

    component.onSubmit();

    expect(notificationService.sendEmail).toHaveBeenCalledOnceWith({
      recipients: ['TestProband1'],
      title: 'Test Subject',
      body: 'Test Content',
    });
  }));

  it('should show a success dialog if mails were sent', fakeAsync(() => {
    component.notifyByEmail.setValue(true);
    component.message.get('recipients').setValue(['TestProband1']);
    component.message.get('title').setValue('Test Subject');
    component.message.get('body').setValue('Test Content');
    tick();

    component.onSubmit();
    tick();

    expect(matDialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: 'CONTACT_PROBAND.EMAILS_SENT',
        values: { probanden: 'TestProband1 (testproband1@example.com)' },
        isSuccess: true,
      },
    });
  }));

  it('should show an error dialog if no mails were sent', fakeAsync(() => {
    notificationService.sendEmail.and.resolveTo([]);

    component.notifyByEmail.setValue(true);
    component.message.get('recipients').setValue(['TestProband1']);
    component.message.get('title').setValue('Test Subject');
    component.message.get('body').setValue('Test Content');
    tick();

    component.onSubmit();
    tick();

    expect(matDialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: 'CONTACT_PROBAND.NO_EMAILS_SENT',
        isSuccess: false,
      },
    });
  }));
});
