/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppModule } from '../../app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { DialogNotificationComponent } from './dialog-notification.component';
import { By } from '@angular/platform-browser';
import {
  NotificationDto,
  SampleNotificationDto,
} from '../../psa.app.core/models/notification';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogNotificationComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogNotificationComponent;

  let dialogRef: SpyObj<MatDialogRef<DialogNotificationComponent>>;
  let notification: NotificationDto;

  beforeEach(async () => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogNotificationComponent>>([
      'close',
    ]);
    notification = createNotificationDto();

    // Build Base Module
    await MockBuilder(DialogNotificationComponent, [
      AppModule,
      MatDialogRef,
      MAT_DIALOG_DATA,
    ])
      .mock(MatDialogRef, dialogRef)
      .mock(MAT_DIALOG_DATA, notification);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(DialogNotificationComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should display the notification content', () => {
    // Arrange
    const titleElem = fixture.debugElement.query(
      By.css('[unit-notification-title]')
    );
    const bodyElem = fixture.debugElement.query(
      By.css('[unit-notification-body]')
    );

    // Assert
    expect(titleElem.nativeElement.innerText).toEqual(notification.title);
    expect(bodyElem.nativeElement.innerText).toEqual(notification.body);
  });

  it('should close the dialog with result "ok"', () => {
    // Arrange
    const confirmButton = fixture.debugElement.query(
      By.css('[unit-notification-confirm-button]')
    );

    // Act
    confirmButton.nativeElement.click();

    // Assert
    expect(dialogRef.close).toHaveBeenCalledOnceWith('ok');
  });

  it('should close the dialog without a result', () => {
    // Arrange
    const cancelButton = fixture.debugElement.query(
      By.css('[unit-notification-cancel-button]')
    );

    // Act
    cancelButton.nativeElement.click();

    // Assert
    expect(dialogRef.close).toHaveBeenCalledOnceWith();
  });

  function createNotificationDto(): SampleNotificationDto {
    return {
      notification_type: 'sample',
      reference_id: '4321',
      title: 'The title',
      body: 'The body',
    };
  }
});
