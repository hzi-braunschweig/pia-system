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
import { createProfessionalUser } from '../../psa.app.core/models/instance.helper.spec';
import { MaterialModule } from '../../material.module';
import SpyObj = jasmine.SpyObj;

describe('InternalUsersComponent', () => {
  let fixture: MockedComponentFixture;
  let component: InternalUsersComponent;
  let authService: SpyObj<AuthService>;

  beforeEach(async () => {
    // Provider and Services
    authService = jasmine.createSpyObj(AuthService, [
      'getProfessionalUsers',
      'deleteUser',
    ]);

    // Build Base Module
    await MockBuilder(InternalUsersComponent, AppModule)
      .mock(AuthService, authService)
      .keep(MaterialModule);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    authService.getProfessionalUsers.and.resolveTo([createProfessionalUser()]);

    // Create component
    fixture = MockRender(InternalUsersComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should create the component', () => {
    expect(component).toBeDefined();
    fixture.detectChanges();
  });
});
