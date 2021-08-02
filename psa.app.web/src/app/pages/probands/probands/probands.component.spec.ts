/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProbandsComponent } from './probands.component';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { By } from '@angular/platform-browser';
import { ProbandsForscherComponent } from '../probands-forscher/probands-forscher.component';
import { MockComponent } from 'ng-mocks';
import { ProbandsUntersuchungsteamComponent } from '../probands-untersuchungsteam/probands-untersuchungsteam.component';

describe('ProbandsComponent', () => {
  let component: ProbandsComponent;
  let fixture: ComponentFixture<ProbandsComponent>;

  const authManager = { currentRole: null };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProbandsComponent,
        MockComponent(ProbandsForscherComponent),
        MockComponent(ProbandsUntersuchungsteamComponent),
      ],
      providers: [{ provide: AuthenticationManager, useValue: authManager }],
    }).compileComponents();
  });

  it('should load the forscher sub component based on the users role', () => {
    createComponentWithRole('Forscher');
    expect(
      fixture.debugElement.query(By.css('app-probands-forscher'))
    ).not.toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-probands-untersuchungsteam'))
    ).toBeNull();
  });

  it('should load the untersuchungsteam sub component based on the users role', () => {
    createComponentWithRole('Untersuchungsteam');
    expect(
      fixture.debugElement.query(By.css('app-probands-forscher'))
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('app-probands-untersuchungsteam'))
    ).not.toBeNull();
  });

  function createComponentWithRole(role): void {
    authManager.currentRole = role;
    fixture = TestBed.createComponent(ProbandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
