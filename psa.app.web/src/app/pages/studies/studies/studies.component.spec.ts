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
import { StudiesComponent } from './studies.component';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  convertToParamMap,
  ParamMap,
} from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { createStudy } from '../../../psa.app.core/models/instance.helper.spec';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import createSpyObj = jasmine.createSpyObj;

describe('StudiesComponent', () => {
  let fixture: ComponentFixture<StudiesComponent>;
  let component: StudiesComponent;
  let queryParamMapGetter: Spy<() => ParamMap>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let authService: SpyObj<AuthService>;
  let snapshot: SpyObj<ActivatedRouteSnapshot>;

  beforeEach(async () => {
    // Provider and Services
    snapshot = createSpyObj<ActivatedRouteSnapshot>(
      'ActivatedRouteSnapshot',
      undefined,
      ['queryParamMap']
    );
    queryParamMapGetter = Object.getOwnPropertyDescriptor(
      snapshot,
      'queryParamMap'
    ).get as Spy;
    authService = createSpyObj<AuthService>('AuthService', [
      'getPendingDeletion',
    ]);

    // Build Base Module
    await MockBuilder(StudiesComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useValue: { snapshot },
      })
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(AuthService, authService);
  });

  describe('init without params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));
      questionnaireService = TestBed.inject(
        QuestionnaireService
      ) as SpyObj<QuestionnaireService>;
      questionnaireService.getStudies.and.resolveTo({
        studies: [
          createStudy({ name: 'Teststudy1' }),
          createStudy({ name: 'Teststudy2' }),
        ],
      });

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });

  describe('init with pending deletion params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(
        convertToParamMap({
          pendingDeletionId: '1',
          type: 'study',
        })
      );
      authService.getPendingDeletion.and.resolveTo({
        id: 1,
        type: 'study',
        for_id: 'Teststudy2',
        requested_for: 'PM-Me',
        requested_by: 'PM-Partner',
      });

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });

  describe('init with pending change params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(
        convertToParamMap({
          pendingStudyChangeId: '1',
        })
      );

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });
});
