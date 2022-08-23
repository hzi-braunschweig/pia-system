/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockComponent, MockPipe, MockProvider, MockService } from 'ng-mocks';

import { SettingsPage } from './settings.page';
import { HeaderComponent } from '../shared/components/header/header.component';
import { DeleteAccountModalService } from '../account/services/delete-account-modal.service';
import { AuthService } from '../auth/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { KeycloakClientService } from '../auth/keycloak-client.service';
import { KeycloakAngularModule } from 'keycloak-angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { AuthModule } from '../auth/auth.module';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;
  let deleteAccountModalService: Partial<DeleteAccountModalService>;
  let authService: AuthService;
  let keycloakClient: KeycloakClientService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        SettingsPage,
        MockPipe(TranslatePipe),
        MockComponent(HeaderComponent),
      ],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        AuthModule,
        KeycloakAngularModule,
        HttpClientTestingModule,
      ],
      providers: [InAppBrowser, MockProvider(TranslateService)],
    }).compileComponents();

    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);

    fixture = TestBed.createComponent(SettingsPage);
    authService = TestBed.inject(AuthService);
    keycloakClient = TestBed.inject(KeycloakClientService);
    router = TestBed.inject(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open account deletion modal', () => {
    const showDeleteAccountModalSpy = spyOn(
      deleteAccountModalService,
      'showDeleteAccountModal'
    );

    component.openDeleteAccountModal();

    expect(showDeleteAccountModalSpy).toHaveBeenCalled();
  });

  describe('Change Password', () => {
    let openAccountManagementSpy;
    let navigateSpy;

    beforeEach(() => {
      openAccountManagementSpy = spyOn(keycloakClient, 'openAccountManagement');
      navigateSpy = spyOn(router, 'navigate');
    });

    it('should open keycloak account management ', () => {
      spyOn(authService, 'isLegacyLogin').and.returnValue(false);

      component.changePasswort();

      expect(openAccountManagementSpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should go to passwort reset page for legacy logins', async () => {
      spyOn(authService, 'isLegacyLogin').and.returnValue(true);

      component.changePasswort();

      expect(openAccountManagementSpy).not.toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(
        ['..', 'auth', 'change-password'],
        { queryParams: { isUserIntent: true, returnTo: 'settings' } }
      );
    });
  });
});
