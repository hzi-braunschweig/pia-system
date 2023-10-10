/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { MockBuilder } from 'ng-mocks';

import { AppModule } from '../app.module';
import { NotificationPresenter } from './notification-presenter.service';
import { CurrentUser } from './current-user.service';
import {
  BaseNotificationDto,
  CustomNotificationDto,
  QuestionnaireNotificationDto,
  SampleNotificationDto,
} from '../psa.app.core/models/notification';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { DialogNotificationComponent } from '../dialogs/dialog-notification/dialog-notification.component';

describe('NotificationPresenter', () => {
  let service: NotificationPresenter;

  let router: SpyObj<Router>;
  let user: SpyObj<CurrentUser>;
  let dialog: SpyObj<MatDialog>;

  beforeEach(async () => {
    // Provider and Services
    router = createSpyObj<Router>('Router', ['navigate']);

    user = createSpyObj<CurrentUser>('CurrentUser', [], {
      username: 'Testuser',
    });

    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => of('ok'),
    } as MatDialogRef<DialogNotificationComponent, string>);

    // Build Base Module
    await MockBuilder(NotificationPresenter, AppModule)
      .mock(Router, router)
      .mock(CurrentUser, user)
      .mock(MatDialog, dialog);
    service = TestBed.inject(NotificationPresenter);
  });

  describe('present', () => {
    it('should open a dialog with the notification content', () => {
      // Arrange
      const notification: SampleNotificationDto = {
        notification_type: 'sample',
        ...createBaseNotificationDto(),
      };

      // Act
      service.present(notification);

      // Assert
      expect(dialog.open).toHaveBeenCalledOnceWith(
        DialogNotificationComponent,
        {
          width: '500px',
          data: notification,
        }
      );
    });

    describe('questionnaire reminder notification', () => {
      it('should navigate to questionnaire on accept', () => {
        // Arrange
        const notification: QuestionnaireNotificationDto = {
          notification_type: 'qReminder',
          questionnaire_id: 'TestQ',
          questionnaire_version: '1',
          ...createBaseNotificationDto(),
        };

        // Act
        service.present(notification);

        // Assert
        expect(router.navigate).toHaveBeenCalledOnceWith([
          '/questionnaire',
          'TestQ',
          '4321',
        ]);
      });
    });

    describe('lab report notification', () => {
      it('should navigate to lab result on accept', () => {
        // Arrange
        const notification: SampleNotificationDto = {
          notification_type: 'sample',
          ...createBaseNotificationDto(),
        };

        // Act
        service.present(notification);

        // Assert
        expect(router.navigate).toHaveBeenCalledOnceWith([
          ['/laboratory-results', '4321'],
          {
            queryParams: { user_id: 'Testuser' },
          },
        ]);
      });
    });

    describe('custom notification', () => {
      it('should not navigate', () => {
        // Arrange
        const notification: CustomNotificationDto = {
          notification_type: 'custom',
          ...createBaseNotificationDto(),
        };

        // Act
        service.present(notification);

        // Assert
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });

  function createBaseNotificationDto(): BaseNotificationDto {
    return {
      reference_id: '4321',
      title: 'The title',
      body: 'The body',
    };
  }
});
