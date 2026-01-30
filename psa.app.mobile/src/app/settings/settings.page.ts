/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DeleteAccountModalService } from '../account/services/delete-account-modal.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import {
  IonContent,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonItem,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonItem,
    RouterLink,
    TranslateModule,
  ],
})
export class SettingsPage {
  constructor(
    private deleteAccountModalService: DeleteAccountModalService,
    private auth: AuthService
  ) {}

  public async openDeleteAccountModal(): Promise<void> {
    await this.deleteAccountModalService.showDeleteAccountModal();
  }

  public async openAccountManagement(): Promise<void> {
    await this.auth.openAccountManagement();
  }
}
