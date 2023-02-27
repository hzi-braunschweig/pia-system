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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import SpyObj = jasmine.SpyObj;
import { BadgeService } from '../shared/services/badge/badge.service';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;

  let deleteAccountModalService: DeleteAccountModalService;
  let auth: AuthService;

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
        HttpClientTestingModule,
      ],
      providers: [
        InAppBrowser,
        MockProvider(TranslateService),
        MockProvider(BadgeService, MockService(BadgeService)),
        MockProvider(KeycloakService, MockService(KeycloakService)),
      ],
    }).compileComponents();

    deleteAccountModalService = TestBed.inject(DeleteAccountModalService);
    auth = TestBed.inject(AuthService);

    fixture = TestBed.createComponent(SettingsPage);

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

    beforeEach(() => {
      openAccountManagementSpy = spyOn(auth, 'openAccountManagement');
    });

    it('should open keycloak account management ', () => {
      component.openAccountManagement();

      expect(openAccountManagementSpy).toHaveBeenCalled();
    });
  });
});
