/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import { AppModule } from '../../app.module';
import { PlannedProbandsComponent } from './planned-probands.component';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { DataService } from '../../_services/data.service';
import SpyObj = jasmine.SpyObj;
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatSort } from '@angular/material/sort';

describe('PlannedProbandsComponent', () => {
  let fixture: MockedComponentFixture;
  let component: PlannedProbandsComponent;

  let authService: SpyObj<AuthService>;
  let dataService: SpyObj<DataService>;
  let matDialog: SpyObj<MatDialog>;

  beforeEach(async () => {
    // Provider and Services
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    authService = jasmine.createSpyObj('AuthService', ['getPlannedProbands']);
    authService.getPlannedProbands.and.resolveTo([
      {
        user_id: 'Test-1234',
        password: 'safestpw',
        activated_at: new Date('2022-10-02'),
        study_accesses: [
          {
            study_id: 'Teststudy',
            user_id: 'Test-1234',
            access_level: 'read',
          },
        ],
        wasCreated: true,
      },
    ]);
    dataService = jasmine.createSpyObj('DataService', [
      'setPlannedProbandsForLetters',
    ]);

    // Build Base Module
    await MockBuilder(PlannedProbandsComponent, AppModule)
      .keep(MatPaginator)
      .keep(MatSort)
      .mock(MatDialog, matDialog)
      .mock(DataService, dataService)
      .mock(AuthService, authService);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(PlannedProbandsComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should get planned probands', () => {
    expect(component).toBeDefined();
    expect(authService.getPlannedProbands).toHaveBeenCalledTimes(1);
  });
});
