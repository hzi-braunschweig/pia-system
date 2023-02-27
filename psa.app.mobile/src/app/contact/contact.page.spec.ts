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
import { AlertButton, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { MockBuilder } from 'ng-mocks';

import { ContactPage } from './contact.page';
import { AuthService } from '../auth/auth.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { User } from '../auth/auth.model';
import { ContactPageModule } from './contact.module';
import { ComplianceService } from '../compliance/compliance-service/compliance.service';
import { ComplianceType } from '../compliance/compliance.model';
import { MaterialClientService } from './material-client.service';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../auth/current-user.service';

describe('ContactPage', () => {
  let component: ContactPage;
  let fixture: ComponentFixture<ContactPage>;

  let currentUser: SpyObj<CurrentUser>;
  let complianceService: SpyObj<ComplianceService>;
  let materialClient: SpyObj<MaterialClientService>;
  let alertCtrl: SpyObj<AlertController>;
  let translate: SpyObj<TranslateService>;
  let toastPresenter: SpyObj<ToastPresenterService>;

  beforeEach(async () => {
    // Provider and Services
    currentUser = jasmine.createSpyObj<CurrentUser>([], {
      username: 'Testuser',
    });
    complianceService = jasmine.createSpyObj<ComplianceService>([
      'userHasCompliances',
    ]);
    materialClient = jasmine.createSpyObj<MaterialClientService>([
      'requestMaterial',
    ]);
    alertCtrl = jasmine.createSpyObj<AlertController>(['create']);
    translate = jasmine.createSpyObj<TranslateService>(['instant']);
    toastPresenter = jasmine.createSpyObj<ToastPresenterService>([
      'presentToast',
    ]);

    // Build Base Module
    await MockBuilder(ContactPage, ContactPageModule)
      .mock(CurrentUser, currentUser)
      .mock(AlertController, alertCtrl)
      .mock(ComplianceService, complianceService)
      .mock(TranslateService, translate)
      .mock(MaterialClientService, materialClient);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = TestBed.createComponent(ContactPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(complianceService.userHasCompliances).toHaveBeenCalledOnceWith([
      ComplianceType.SAMPLES,
    ]);
  });

  it('should present a dialog to request sample material', async () => {
    const alert = jasmine.createSpyObj<HTMLIonAlertElement>(['present']);
    alertCtrl.create.and.resolveTo(alert);
    await component.presentConfirmNewMaterial();
    expect(alert.present).toHaveBeenCalled();
    const alertArgs = alertCtrl.create.calls.first().args[0];
    const confirmButton: AlertButton = alertArgs.buttons[1] as AlertButton;
    confirmButton.handler(null);
    expect(materialClient.requestMaterial).toHaveBeenCalledOnceWith(
      currentUser.username
    );
  });
});
