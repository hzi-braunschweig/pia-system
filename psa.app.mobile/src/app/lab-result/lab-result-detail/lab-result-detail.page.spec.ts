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
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LabResultDetailPage } from './lab-result-detail.page';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/auth.model';
import SpyObj = jasmine.SpyObj;

describe('LabResultDetailPage', () => {
  let component: LabResultDetailPage;
  let fixture: ComponentFixture<LabResultDetailPage>;

  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;
  let auth: SpyObj<AuthService>;
  let activatedRoute;

  const labResultHtml: string = 'this is a <b>lab result</b>';

  beforeEach(() => {
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'getLabResultForUser',
    ]);
    sampleTrackingClient.getLabResultForUser.and.resolveTo(labResultHtml);
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    auth.getCurrentUser.and.returnValue({ username: 'Test-1234' } as User);
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

  it("should show the proband's lab result as HTML", fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    const content = fixture.debugElement.query(
      By.css('[data-unit="lab-result-html"]')
    );
    expect(content).not.toBeNull();
    expect(content.nativeElement.innerHTML).toEqual(labResultHtml);
  }));
});
