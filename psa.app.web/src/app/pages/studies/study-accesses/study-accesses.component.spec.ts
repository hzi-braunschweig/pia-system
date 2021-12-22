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
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import {
  createProfessionalUser,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import SpyObj = jasmine.SpyObj;

describe('StudyAccessesComponent', () => {
  let fixture: ComponentFixture<StudyAccessesComponent>;
  let component: StudyAccessesComponent;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
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
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>;
    authService.getProfessionalUsers.and.resolveTo([
      createProfessionalUser({
        study_accesses: [{ study_id: 'current study', access_level: 'admin' }],
      }),
      createProfessionalUser({
        study_accesses: [{ study_id: 'current study', access_level: 'read' }],
      }),
      createProfessionalUser({
        study_accesses: [{ study_id: 'other study', access_level: 'write' }],
      }),
      createProfessionalUser(),
    ]);

    questionnaireService = TestBed.inject(
      QuestionnaireService
    ) as SpyObj<QuestionnaireService>;
    questionnaireService.getStudy.and.resolveTo(
      createStudy({ name: 'current study' })
    );

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
