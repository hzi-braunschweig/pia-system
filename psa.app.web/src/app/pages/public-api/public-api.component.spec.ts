/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PublicApiComponent } from './public-api.component';
import { MockBuilder, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { delay, EMPTY, of, Subject, throwError } from 'rxjs';
import { PublicApiService } from './public-api.service';
import { PublicApiModule } from './public-api.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { LoadingSpinnerComponent } from '../../features/loading-spinner/loading-spinner.component';
import { ApiClientDto } from './api-client.model';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogAddApiClientComponent } from '../../dialogs/dialog-add-api-client/dialog-add-api-client.component';
import { DialogYesNoComponent } from '../../dialogs/dialog-yes-no/dialog-yes-no';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import { AlertService } from '../../_services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('PublicApiComponent', () => {
  let afterClosedSubject;
  let dialog: SpyObj<MatDialog>;
  let publicApiService: SpyObj<PublicApiService>;
  let alertService: SpyObj<AlertService>;

  beforeEach(() => {
    afterClosedSubject = new Subject();
    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);

    publicApiService = createSpyObj<PublicApiService>('PublicApiService', [
      'getApiClients',
      'createApiClient',
      'deleteApiClient',
    ]);
    publicApiService.getApiClients.and.returnValue(
      of([
        createApiClient({ clientId: 'test-client-1' }),
        createApiClient({ clientId: 'test-client-2' }),
      ]).pipe(delay(100))
    );
    publicApiService.createApiClient.and.returnValue(EMPTY);
    publicApiService.deleteApiClient.and.returnValue(EMPTY);
    alertService = createSpyObj<AlertService>('AlertService', ['errorObject']);

    return MockBuilder(PublicApiComponent, PublicApiModule)
      .keep(MatCardModule)
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .provide(MockProvider(AlertService, alertService))
      .mock(BrowserAnimationsModule, { export: true })
      .mock(PublicApiService, publicApiService)
      .mock(MatDialog, dialog)
      .mock(TranslatePipe, (value) => value);
  });

  it('should show a loading indicator while loading', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);

    expect(ngMocks.find(LoadingSpinnerComponent)).toBeDefined();
    tick(100);
    component.detectChanges();

    expect(ngMocks.find(LoadingSpinnerComponent, null)).toBeNull();
  }));

  it('should show an empty state hint', fakeAsync(() => {
    publicApiService.getApiClients.and.returnValue(of([]).pipe(delay(100)));
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    const emptyHint = ngMocks.find('[data-unit="empty-hint"]');

    expect(emptyHint.nativeElement.innerText).toEqual('PUBLIC_API.EMPTY_HINT');
  }));

  it('should list all API clients', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    const apiClientCards = ngMocks.findAll('[data-unit="client-card"]');

    expect(apiClientCards.length).toEqual(2);
  }));

  it('should show the client ID of a client', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    const inputs = ngMocks.findAll('[data-unit="client-id-input"]');

    expect(inputs.length).toEqual(2);
    expect(inputs[0].nativeElement.value).toEqual('test-client-1');
    expect(inputs[1].nativeElement.value).toEqual('test-client-2');
  }));

  it('should hide the secret of a client', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    const input = ngMocks.find('[data-unit="client-secret-input"]');

    expect(input.nativeElement.type).toEqual('password');
  }));

  it('should show the secret of a single client on click', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    const input = ngMocks.find('[data-unit="client-secret-input"]');

    ngMocks.click('[data-unit="show-secret-button"]');
    component.detectChanges();

    expect(input.nativeElement.type).toEqual('text');
  }));

  it('should add a new client', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    ngMocks.click('[data-unit="add-client-button"]');

    expect(dialog.open).toHaveBeenCalledOnceWith(DialogAddApiClientComponent, {
      width: '500px',
    });
    afterClosedSubject.next({
      name: 'test-name',
      studies: ['study-1', 'study-2'],
    });
    tick();

    expect(publicApiService.createApiClient).toHaveBeenCalledOnceWith({
      name: 'test-name',
      studies: ['study-1', 'study-2'],
    });
  }));

  it('should show an error if adding a new client fails', fakeAsync(() => {
    const error = new HttpErrorResponse({
      error: {
        error: 'test-error',
        errorCode: 'API_CLIENT_NOT_FOUND',
        message: 'test-message',
        statusCode: 409,
      },
    });
    publicApiService.createApiClient.and.returnValue(throwError(() => error));
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    ngMocks.click('[data-unit="add-client-button"]');

    expect(dialog.open).toHaveBeenCalledOnceWith(DialogAddApiClientComponent, {
      width: '500px',
    });
    afterClosedSubject.next({
      name: 'test-name',
      studies: ['study-1', 'study-2'],
    });
    tick();

    expect(publicApiService.createApiClient).toHaveBeenCalledOnceWith({
      name: 'test-name',
      studies: ['study-1', 'study-2'],
    });
    expect(alertService.errorObject).toHaveBeenCalledWith(
      error,
      'PUBLIC_API.API_CLIENT_NOT_FOUND'
    );
  }));

  it('should delete a client', fakeAsync(() => {
    const component = MockRender(PublicApiComponent);
    tick(100);
    component.detectChanges();

    ngMocks.click('[data-unit="delete-client-button"]');

    expect(dialog.open).toHaveBeenCalledOnceWith(DialogYesNoComponent, {
      data: {
        content: 'PUBLIC_API.CLIENT_DELETION_CONFIRMATION_QUESTION',
      },
    });
    afterClosedSubject.next('yes');
    tick();

    expect(publicApiService.deleteApiClient).toHaveBeenCalledOnceWith(
      'test-client-1'
    );
  }));

  function createApiClient(overwrite: Partial<ApiClientDto>): ApiClientDto {
    return {
      clientId: 'client-id',
      name: 'client-name',
      studies: ['study-1', 'study-2'],
      secret: 'client-secret',
      createdAt: new Date().toISOString(),
      ...overwrite,
    };
  }
});
