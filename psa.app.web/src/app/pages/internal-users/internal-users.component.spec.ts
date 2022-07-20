/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { InternalUsersComponent } from './internal-users.component';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { createProfessionalAccount } from '../../psa.app.core/models/instance.helper.spec';
import { MaterialModule } from '../../material.module';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import SpyObj = jasmine.SpyObj;

describe('InternalUsersComponent', () => {
  let fixture: MockedComponentFixture;
  let component: InternalUsersComponent;
  let authService: SpyObj<AuthService>;
  let userService: SpyObj<UserService>;

  beforeEach(async () => {
    // Provider and Services
    authService = jasmine.createSpyObj(AuthService, ['deleteUser']);
    userService = jasmine.createSpyObj(AuthService, [
      'getProfessionalAccounts',
    ]);

    // Build Base Module
    await MockBuilder(InternalUsersComponent, AppModule)
      .mock(AuthService, authService)
      .mock(UserService, userService)
      .keep(MaterialModule);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    userService.getProfessionalAccounts.and.resolveTo([
      createProfessionalAccount(),
    ]);

    // Create component
    fixture = MockRender(InternalUsersComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }));

  it('should initialize the table data', () => {
    expect(userService.getProfessionalAccounts).toHaveBeenCalledOnceWith({
      role: 'Forscher',
    });
    expect(component.dataSource.data).toEqual([createProfessionalAccount()]);
  });

  it('should fetch accounts for role selection change', fakeAsync(() => {
    component.selectedRole.setValue('ProbandenManager');
    tick();
    expect(userService.getProfessionalAccounts).toHaveBeenCalledWith({
      role: 'ProbandenManager',
    });
  }));
});
