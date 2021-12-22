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
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import { createProband } from '../../../psa.app.core/models/instance.helper.spec';
import createSpy = jasmine.createSpy;
import { NotificationService } from '../../../psa.app.core/providers/notification-service/notification-service';
import { MatDialog } from '@angular/material/dialog';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { PersonalData } from '../../../psa.app.core/models/personalData';

describe('ContactProbandComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ContactProbandComponent;

  let authService: SpyObj<AuthService>;
  let notificationService: SpyObj<NotificationService>;
  let personalDataService: SpyObj<PersonalDataService>;
  let matDialog: SpyObj<MatDialog>;

  beforeEach(async () => {
    // Provider and Services
    authService = createSpyObj<AuthService>(['getProbands']);
    authService.getProbands.and.resolveTo([
      createProband({ pseudonym: 'TestProband1' }),
      createProband({ pseudonym: 'TestProband2', status: 'deactivated' }),
    ]);
    notificationService = createSpyObj<NotificationService>([
      'sendNotification',
      'sendEmail',
    ]);
    notificationService.sendNotification.and.resolveTo(null);
    notificationService.sendEmail.and.resolveTo(null);
    personalDataService = createSpyObj<PersonalDataService>([
      'getPersonalDataAll',
    ]);
    personalDataService.getPersonalDataAll.and.resolveTo([
      {
        pseudonym: 'TestProband1',
        email: 'testproband1@example.com',
      } as PersonalData,
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
      .mock(AuthService, authService)
      .mock(NotificationService, notificationService)
      .mock(PersonalDataService, personalDataService)
      .mock(MatDialog, matDialog);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component

    // Create component
    fixture = MockRender(ContactProbandComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should prefill given usernames', () => {
    expect(component).toBeDefined();
    expect(component.pseudonyms).toEqual(['TestProband1', 'TestProband2']);
  });

  it('should request all available active probands for autocomplete', fakeAsync(() => {
    const allPseudonymsSpy = createSpy();
    component.autoCompletePseudonyms.subscribe(allPseudonymsSpy);
    tick();
    expect(allPseudonymsSpy).toHaveBeenCalledOnceWith(['TestProband1']);
  }));

  it('should send notification request', () => {
    component.contactAll = true;
    component.notifyByNotification = true;
    component.subject.setValue('Test Subject');
    component.content.setValue('Test Content');

    component.onSubmit();

    expect(notificationService.sendNotification).toHaveBeenCalledOnceWith({
      recipients: ['TestProband1'],
      title: 'Test Subject',
      body: 'Test Content',
    });
  });

  it('should send email notification request', () => {
    component.contactAll = true;
    component.notifyByEmail = true;
    component.subject.setValue('Test Subject');
    component.content.setValue('Test Content');

    component.onSubmit();

    expect(notificationService.sendEmail).toHaveBeenCalledOnceWith({
      recipients: ['TestProband1'],
      title: 'Test Subject',
      body: 'Test Content',
    });
  });
});
