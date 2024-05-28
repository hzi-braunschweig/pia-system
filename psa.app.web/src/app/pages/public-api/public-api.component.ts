/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { finalize, Observable, switchMap } from 'rxjs';
import { ApiClientDto, CreateApiClientRequestDto } from './api-client.model';
import { PublicApiService } from './public-api.service';
import { DialogYesNoComponent } from '../../dialogs/dialog-yes-no/dialog-yes-no';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddApiClientComponent } from '../../dialogs/dialog-add-api-client/dialog-add-api-client.component';
import { AlertService } from '../../_services/alert.service';
import { isSpecificHttpError } from '../../psa.app.core/models/specificHttpError';

@Component({
  selector: 'app-public-api',
  templateUrl: './public-api.component.html',
  styleUrls: ['./public-api.component.scss'],
})
export class PublicApiComponent {
  public isLoading = true;
  public apiClients: Observable<ApiClientDto[]> = this.getApiClients();
  public showSecretForClientId = null;

  constructor(
    private readonly publicApiService: PublicApiService,
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService
  ) {}

  public showSecret(clientId: string): boolean {
    return this.showSecretForClientId === clientId;
  }

  public toggleShowSecret(clientId: string): void {
    this.showSecretForClientId =
      this.showSecretForClientId === clientId ? null : clientId;
  }

  public addApiClient(): void {
    this.dialog
      .open<DialogAddApiClientComponent, undefined, CreateApiClientRequestDto>(
        DialogAddApiClientComponent,
        {
          width: '500px',
        }
      )
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        switchMap((result) => this.publicApiService.createApiClient(result))
      )
      .subscribe({
        next: () => (this.apiClients = this.getApiClients()),
        error: (error) =>
          this.alertService.errorObject(error, this.getErrorMessage(error)),
      });
  }

  public deleteApiClient(clientId: string): void {
    this.dialog
      .open(DialogYesNoComponent, {
        data: {
          content: 'PUBLIC_API.CLIENT_DELETION_CONFIRMATION_QUESTION',
        },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === 'yes'),
        switchMap(() => this.publicApiService.deleteApiClient(clientId))
      )
      .subscribe({
        next: () => (this.apiClients = this.getApiClients()),
        error: (error) =>
          this.alertService.errorObject(error, this.getErrorMessage(error)),
      });
  }

  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
  }

  private getApiClients(): Observable<ApiClientDto[]> {
    this.isLoading = true;
    return this.publicApiService
      .getApiClients()
      .pipe(finalize(() => (this.isLoading = false)));
  }

  private getErrorMessage(error: unknown): string {
    if (!isSpecificHttpError(error)) {
      return 'ERROR.ERROR_UNKNOWN';
    }
    switch (error.error.errorCode) {
      case 'API_CLIENT_NOT_FOUND':
        return 'PUBLIC_API.API_CLIENT_NOT_FOUND';
      case 'API_CLIENT_ALREADY_EXISTS':
        return 'PUBLIC_API.API_CLIENT_ALREADY_EXISTS';
      default:
        return 'ERROR.ERROR_UNKNOWN';
    }
  }
}
