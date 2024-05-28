/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EventHistorySettingsComponent } from './event-history-settings.component';
import { AlertService } from '../../../_services/alert.service';
import {
  MockBuilder,
  MockRender,
  MockProvider,
  MockedComponentFixture,
} from 'ng-mocks';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { of, Subject, throwError } from 'rxjs';
import { EventHistorySettingsDto } from './event-history-settings.dto';
import { PublicApiModule } from '../public-api.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { DialogOkCancelComponent } from '../../../_helpers/dialog-ok-cancel';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { EventHistorySettingsService } from './event-history-settings.service';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { take } from 'rxjs/operators';

describe('EventHistorySettingsComponent', () => {
  let dialog: SpyObj<MatDialog>;
  let alertService: SpyObj<AlertService>;
  let eventHistorySettingsService: SpyObj<EventHistorySettingsService>;
  let getConfigSubject: Subject<EventHistorySettingsDto>;
  let afterClosedSubject: Subject<string>;

  beforeEach(async () => {
    getConfigSubject = new Subject();
    afterClosedSubject = new Subject();

    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);

    alertService = createSpyObj<AlertService>('AlertService', ['errorObject']);

    eventHistorySettingsService = createSpyObj<EventHistorySettingsService>([
      'get',
      'post',
    ]);
    eventHistorySettingsService.get.and.returnValues(
      // initial value to return when component runs ngOnInit()
      of({ retentionTimeInDays: 0, active: false }),
      getConfigSubject.asObservable().pipe(take(1))
    );

    return MockBuilder(EventHistorySettingsComponent, PublicApiModule)
      .keep(MatCardModule)
      .keep(MatFormFieldModule)
      .keep(MatSlideToggleModule)
      .keep(MatInputModule)
      .keep(MatDialogModule)
      .provide(MockProvider(AlertService, alertService))
      .mock(TranslateService, { instant: (value) => value })
      .mock(BrowserAnimationsModule, { export: true })
      .mock(EventHistorySettingsService, eventHistorySettingsService)
      .mock(MatDialog, dialog)
      .mock(TranslatePipe, (value) => value);
  });

  it('should emit loading status when initially fetching settings', () => {
    const fixture = MockRender(EventHistorySettingsComponent);
    const emitSpy = spyOn(fixture.componentInstance.loading, 'emit');

    fixture.point.componentInstance.ngOnInit();
    getConfigSubject.next({ retentionTimeInDays: 0, active: false });

    expect(emitSpy).withContext('is loading').toHaveBeenCalledWith(true);
    expect(emitSpy).withContext('loading done').toHaveBeenCalledWith(false);
  });

  it('should emit loading status when saving settings', () => {
    const newSettings: EventHistorySettingsDto = {
      retentionTimeInDays: 30,
      active: false,
    };
    const fixture = MockRender(EventHistorySettingsComponent);

    fixture.componentInstance.ngOnInit();
    getConfigSubject.next(newSettings);

    fixture.componentInstance.formGroup.setValue(newSettings);

    const emitSpy = spyOn(fixture.componentInstance.loading, 'emit');

    eventHistorySettingsService.post.and.returnValue(
      of(newSettings).pipe(take(1))
    );

    fixture.componentInstance.save();

    expect(emitSpy).withContext('is loading').toHaveBeenCalledWith(true);
    expect(emitSpy).withContext('loading done').toHaveBeenCalledWith(false);
  });

  it('should show success dialog after saving settings', async () => {
    const newSettings: EventHistorySettingsDto = {
      retentionTimeInDays: 30,
      active: false,
    };

    const fixture = MockRender(EventHistorySettingsComponent);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.formGroup.setValue(newSettings);

    eventHistorySettingsService.post.and.returnValue(
      of(newSettings).pipe(take(1))
    );
    fixture.componentInstance.save();

    expect(dialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
      width: '500px',
      data: {
        content: 'EVENT_HISTORY.SAVE_SUCCESS',
        isSuccess: true,
      },
    });
  });

  it('should show error dialog after saving settings failed', async () => {
    const newSettings: EventHistorySettingsDto = {
      retentionTimeInDays: 30,
      active: false,
    };

    const fixture = MockRender(EventHistorySettingsComponent);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.formGroup.setValue(newSettings);

    eventHistorySettingsService.post.and.returnValue(
      throwError(() => new Error()).pipe(take(1))
    );
    fixture.componentInstance.save();

    expect(dialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
      width: '500px',
      data: {
        content: 'EVENT_HISTORY.SAVE_FAILED',
        isSuccess: false,
      },
    });
  });

  it('should be invalid when retention time is zero and history is enabled', () => {
    const fixture = MockRender(EventHistorySettingsComponent);

    fixture.componentInstance.formGroup.setValue({
      retentionTimeInDays: 0,
      active: true,
    });

    fixture.detectChanges();

    expect(fixture.componentInstance.formGroup.invalid).toBeTrue();

    fixture.componentInstance.formGroup.setValue({
      retentionTimeInDays: 30,
      active: true,
    });

    fixture.detectChanges();

    expect(fixture.componentInstance.formGroup.invalid).toBeFalse();
  });

  describe('deactivation confirmation dialog', () => {
    let fixture: MockedComponentFixture<
      EventHistorySettingsComponent,
      EventHistorySettingsComponent
    >;

    beforeEach(() => {
      fixture = MockRender(EventHistorySettingsComponent);

      fixture.componentInstance.config = {
        retentionTimeInDays: 30,
        active: true,
      };

      fixture.componentInstance.formGroup.setValue({
        retentionTimeInDays: 30,
        active: false,
      });

      fixture.detectChanges();

      fixture.componentInstance.save();
    });

    it('should show dialog on save when deactivating event history and save on confirming', () => {
      expect(dialog.open).toHaveBeenCalledOnceWith(DialogOkCancelComponent, {
        width: '500px',
        data: {
          q: 'EVENT_HISTORY.CONFIRM_DEACTIVATION_TITLE',
          content: 'EVENT_HISTORY.CONFIRM_DEACTIVATION_BODY',
        },
      });

      afterClosedSubject.next('ok');

      expect(eventHistorySettingsService.post).toHaveBeenCalledOnceWith({
        retentionTimeInDays: 30,
        active: false,
      });
    });

    it('should do nothing on cancelling dialog', () => {
      afterClosedSubject.next('');
      expect(eventHistorySettingsService.post).not.toHaveBeenCalled();
    });
  });
});
