/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { MockBuilder } from 'ng-mocks';

import { HomeComponent } from './home.component';
import { CurrentUser } from '../../_services/current-user.service';
import { AppModule } from '../../app.module';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { NotificationService } from '../../psa.app.core/providers/notification-service/notification-service';
import { NotificationPresenter } from '../../_services/notification-presenter.service';
import { SampleNotificationDto } from '../../psa.app.core/models/notification';
import SpyObj = jasmine.SpyObj;

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  let user: SpyObj<CurrentUser>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let activatedRoute: SpyObj<ActivatedRoute>;
  let queryParamsSubject: Subject<Params>;
  let notificationService: SpyObj<NotificationService>;
  let notification: SpyObj<NotificationPresenter>;
  let router: Router;

  beforeEach(async () => {
    user = jasmine.createSpyObj<CurrentUser>(
      'CurrentUser',
      ['isProband', 'isProfessional'],
      {
        study: 'Teststudy',
      }
    );
    user.isProband.and.returnValue(true);
    questionnaireService = jasmine.createSpyObj<QuestionnaireService>(
      'QuestionnaireService',
      ['getStudyWelcomeText']
    );
    questionnaireService.getStudyWelcomeText.and.resolveTo({
      study_id: 'Teststudy',
      welcome_text: 'Welcome',
      language: 'de-de',
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    queryParamsSubject = new Subject<Params>();
    activatedRoute = jasmine.createSpyObj<ActivatedRoute>(
      'ActivatedRoute',
      [],
      {
        queryParams: queryParamsSubject.asObservable(),
      }
    );

    notificationService = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['getNotificationById']
    );

    notification = jasmine.createSpyObj<NotificationPresenter>(
      'NotificationComponent',
      ['present']
    );

    await MockBuilder(HomeComponent, AppModule)
      .mock(CurrentUser, user)
      .mock(QuestionnaireService, questionnaireService)
      .mock(ActivatedRoute, activatedRoute)
      .mock(NotificationService, notificationService)
      .mock(NotificationPresenter, notification)
      .mock(Router, router);
  });

  describe('ngOnInit()', () => {
    it('should request the welcome text for probands', fakeAsync(() => {
      createComponent();
      expect(component.welcomeText).toEqual('Welcome');
    }));

    it('should redirect professionals to study page', fakeAsync(() => {
      user.isProfessional.and.returnValue(true);
      createComponent();
      expect(router.navigate).toHaveBeenCalledWith(['study']);
    }));

    it('should not try to show welcome text if user has professional role', fakeAsync(() => {
      user.isProfessional.and.returnValue(true);
      user.isProband.and.returnValue(false);

      createComponent();

      expect(questionnaireService.getStudyWelcomeText).not.toHaveBeenCalled();
    }));

    it('should request notification on param changes', fakeAsync(() => {
      // Arrange
      createComponent();
      notificationService.getNotificationById.and.resolveTo(
        createNotificationDto()
      );
      spyOn(component, 'presentNotification');
      const params = { notification_id: '1234' };

      // Act
      queryParamsSubject.next(params);
      tick();

      // Assert
      expect(component.presentNotification).toHaveBeenCalledWith('1234');
    }));
  });

  describe('getNotificationData()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should present notification', async () => {
      // Arrange
      notificationService.getNotificationById.and.resolveTo(
        createNotificationDto()
      );

      // Act
      await component.presentNotification('1234');

      // Assert
      expect(notification.present).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      // Arrange
      notificationService.getNotificationById.and.rejectWith('error');

      // Act
      await component.presentNotification('1234');

      // Assert
      expect(notificationService.getNotificationById).toHaveBeenCalledWith(
        '1234'
      );
      expect(notification.present).not.toHaveBeenCalled();
    });
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }

  function createNotificationDto(): SampleNotificationDto {
    return {
      notification_type: 'sample',
      reference_id: '4321',
      title: 'The title',
      body: 'The body',
    };
  }
});
