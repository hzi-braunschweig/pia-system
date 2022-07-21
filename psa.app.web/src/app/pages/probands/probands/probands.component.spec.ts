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
import { By } from '@angular/platform-browser';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../../../_services/current-user.service';

describe('ProbandsComponent', () => {
  let component: ProbandsComponent;
  let fixture: ComponentFixture<ProbandsComponent>;
  let user: SpyObj<CurrentUser>;

  beforeEach(async () => {
    // Provider and Services
    user = jasmine.createSpyObj<CurrentUser>(['hasRole']);

    // Build Base Module
    await MockBuilder(ProbandsComponent, AppModule).mock(CurrentUser, user);
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

  function createComponentWithRole(userRole: string): void {
    // Setup mocks before creating component
    user.hasRole.and.callFake((role) => role === userRole);

    // Create component
    fixture = TestBed.createComponent(ProbandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }
});
