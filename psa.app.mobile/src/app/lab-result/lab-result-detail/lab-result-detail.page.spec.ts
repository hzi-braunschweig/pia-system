/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LabResultDetailPage } from './lab-result-detail.page';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { AuthService } from '../../auth/auth.service';
import SpyObj = jasmine.SpyObj;

describe('LabResultDetailPage', () => {
  let component: LabResultDetailPage;
  let fixture: ComponentFixture<LabResultDetailPage>;

  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;
  let auth: SpyObj<AuthService>;
  let activatedRoute;

  beforeEach(() => {
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'getLabResultForUser',
    ]);
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    activatedRoute = {
      snapshot: { paramMap: convertToParamMap({ labResultId: '1234' }) },
    };

    TestBed.configureTestingModule({
      declarations: [LabResultDetailPage],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: SampleTrackingClientService,
          useValue: sampleTrackingClient,
        },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabResultDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
