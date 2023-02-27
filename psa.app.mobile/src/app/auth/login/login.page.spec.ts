/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MockBuilder } from 'ng-mocks';

import { LoginPage } from './login.page';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { AuthModule } from '../auth.module';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import SpyObj = jasmine.SpyObj;

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  let loadingCtrl: SpyObj<LoadingController>;
  let router: SpyObj<Router>;
  let alertCtrl: SpyObj<AlertController>;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(async () => {
    loadingCtrl = jasmine.createSpyObj(LoadingController, ['create']);
    router = jasmine.createSpyObj(Router, ['navigate']);
    alertCtrl = jasmine.createSpyObj(AlertController, ['create']);
    endpoint = jasmine.createSpyObj(EndpointService, [
      'setEndpointForUser',
      'isEndpointCompatible',
    ]);

    const loading = {
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve(true),
    } as HTMLIonLoadingElement;
    loadingCtrl.create.and.resolveTo(loading);

    const alert = {
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve(true),
    } as HTMLIonAlertElement;
    alertCtrl.create.and.resolveTo(alert);

    await MockBuilder(LoginPage, AuthModule)
      .mock(EndpointService, endpoint)
      .mock(AlertController, alertCtrl)
      .mock(LoadingController, loadingCtrl)
      .mock(Router, router);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
