/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountInfoComponent } from './account-info.component';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakInstance } from 'keycloak-js';
import { By } from '@angular/platform-browser';
import { MockComponent, MockDirective, MockPipe, MockProvider } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatLegacyButton as MatButton } from '@angular/material/legacy-button';
import { MatLegacyTooltip as MatTooltip } from '@angular/material/legacy-tooltip';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;

describe('AccountInfoComponent', () => {
  let component: AccountInfoComponent;
  let fixture: ComponentFixture<AccountInfoComponent>;

  let keycloak: SpyObj<KeycloakService>;
  let accountManagementSpy: Spy;

  beforeEach(async () => {
    keycloak = jasmine.createSpyObj('KeyloakService', ['getKeycloakInstance']);
    accountManagementSpy = createSpy('accountManagement');
    keycloak.getKeycloakInstance.and.returnValue({
      accountManagement: accountManagementSpy,
    } as unknown as KeycloakInstance);

    await TestBed.configureTestingModule({
      declarations: [
        AccountInfoComponent,
        MockPipe(TranslatePipe, (value) => value),
        MockComponent(MatIcon),
        MockComponent(MatButton),
        MockDirective(MatTooltip),
      ],
      providers: [MockProvider(KeycloakService, keycloak)],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display username', () => {
    component.username = 'Testuser';
    component.ngOnInit();
    fixture.detectChanges();

    const usernameElement = fixture.debugElement.query(
      By.css('[data-unit="username"]')
    );

    expect(usernameElement).not.toBeNull();
    expect(usernameElement.nativeElement.innerText).toContain('Testuser');
  });

  it('should display the role translation', () => {
    component.role = 'Forscher';
    component.ngOnInit();
    fixture.detectChanges();

    const roleElement = fixture.debugElement.query(
      By.css('[data-unit="role"]')
    );

    expect(roleElement).not.toBeNull();
    expect(roleElement.nativeElement.innerText).toContain('ROLES.RESEARCHER');
  });

  it('should send user to account console on click', () => {
    const manageButton = fixture.debugElement.query(
      By.css('[data-unit="manage-account"]')
    );
    expect(manageButton).not.toBeNull();

    manageButton.nativeElement.click();
    expect(accountManagementSpy).toHaveBeenCalledTimes(1);
  });
});
