/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { LabResultListPage } from './lab-result-list.page';
import { AuthService } from '../../auth/auth.service';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../../auth/current-user.service';

describe('LabResultListPage', () => {
  let component: LabResultListPage;
  let fixture: ComponentFixture<LabResultListPage>;

  let currentUser: SpyObj<CurrentUser>;
  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;

  beforeEach(() => {
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      username: 'Test-1234',
    });
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'getUserLabResults',
    ]);
    sampleTrackingClient.getUserLabResults.and.resolveTo([
      {
        id: '1234',
        user_id: 'Test-1234',
        date_of_sampling: '',
        status: '',
        remark: '',
        new_samples_sent: true,
        performing_doctor: '',
        dummy_sample_id: '',
      },
    ]);

    TestBed.configureTestingModule({
      declarations: [LabResultListPage, MockPipe(TranslatePipe)],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: CurrentUser, useValue: currentUser },
        {
          provide: SampleTrackingClientService,
          useValue: sampleTrackingClient,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabResultListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load labResults list', async () => {
    await fixture.whenStable();
    expect(sampleTrackingClient.getUserLabResults).toHaveBeenCalledOnceWith(
      'Test-1234'
    );
    expect(component.labResults).toHaveSize(1);
  });
});
