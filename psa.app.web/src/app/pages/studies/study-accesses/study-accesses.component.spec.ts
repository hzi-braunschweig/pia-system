/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { StudyAccessesComponent } from './study-accesses.component';
import {
  createProfessionalAccount,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatSortModule } from '@angular/material/sort';
import { AlertService } from '../../../_services/alert.service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import SpyObj = jasmine.SpyObj;

describe('StudyAccessesComponent', () => {
  let fixture: ComponentFixture<StudyAccessesComponent>;
  let component: StudyAccessesComponent;
  let userService: SpyObj<UserService>;
  let alertService: SpyObj<AlertService>;

  beforeEach(async () => {
    // Provider and Services
    const activatedRoute = {
      snapshot: { paramMap: convertToParamMap({ name: 'current study' }) },
    };

    // Build Base Module
    await MockBuilder(StudyAccessesComponent, AppModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .provide({
        provide: ActivatedRoute,
        useValue: activatedRoute,
      });
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    userService = TestBed.inject(UserService) as SpyObj<UserService>;
    userService.getProfessionalAccounts.and.resolveTo([
      createProfessionalAccount({
        studies: ['current study'],
      }),
      createProfessionalAccount({
        studies: ['current study'],
      }),
      createProfessionalAccount({
        studies: ['other study'],
      }),
      createProfessionalAccount(),
    ]);
    userService.getStudyAccesses.and.resolveTo([]);
    userService.deleteUserFromStudy.and.resolveTo();
    userService.getStudy.and.resolveTo(createStudy({ name: 'current study' }));

    alertService = TestBed.inject(AlertService) as SpyObj<AlertService>;

    // Create component
    fixture = TestBed.createComponent(StudyAccessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  it('should create the component', () => {
    expect(component).toBeDefined();
    fixture.detectChanges();
    expect(alertService.errorObject).not.toHaveBeenCalled();
  });
});
