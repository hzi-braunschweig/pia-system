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
import { ProbandsComponent } from './probands.component';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { By } from '@angular/platform-browser';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import SpyObj = jasmine.SpyObj;

describe('ProbandsComponent', () => {
  let component: ProbandsComponent;
  let fixture: ComponentFixture<ProbandsComponent>;
  let auth: SpyObj<AuthenticationManager>;

  beforeEach(async () => {
    // Provider and Services
    auth = jasmine.createSpyObj<AuthenticationManager>(
      'AuthenticationManager',
      ['getCurrentRole']
    );

    // Build Base Module
    await MockBuilder(ProbandsComponent, AppModule).mock(
      AuthenticationManager,
      auth
    );
  });

  it('should load the forscher sub component based on the users role', fakeAsync(() => {
    createComponentWithRole('Forscher');
    expect(
      fixture.debugElement.query(By.css('app-probands-forscher'))
    ).not.toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-probands-untersuchungsteam'))
    ).toBeNull();
  }));

  it('should load the untersuchungsteam sub component based on the users role', fakeAsync(() => {
    createComponentWithRole('Untersuchungsteam');
    expect(
      fixture.debugElement.query(By.css('app-probands-forscher'))
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-probands-untersuchungsteam'))
    ).not.toBeNull();
  }));

  function createComponentWithRole(role): void {
    // Setup mocks before creating component
    auth.getCurrentRole.and.returnValue(role);

    // Create component
    fixture = TestBed.createComponent(ProbandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }
});
