/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComplianceViewListComponent } from './compliance-view-list.component';
import { ComplianceViewListEntryComponent } from './compliance-view-list-entry.component';
import { ComplianceData } from '../../../psa.app.core/models/compliance';
import { By } from '@angular/platform-browser';
import { MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';

describe('ComplianceViewListComponent', () => {
  let component: ComplianceViewListComponent;
  let fixture: ComponentFixture<ComplianceViewListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ComplianceViewListComponent,
        ComplianceViewListEntryComponent,
        MockPipe(TranslatePipe, (value) => value),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceViewListComponent);
    component = fixture.componentInstance;
  });

  it('should show the compliances data without custom text field values', () => {
    component.compliance = getComplianceData();
    fixture.detectChanges();

    const listEntries = fixture.debugElement.queryAll(
      By.css('[unit-list-entry]')
    );
    expect(listEntries.length).toBe(5);

    const names = listEntries.map(
      (entry) =>
        entry.query(By.css('[unit-list-entry-name]')).nativeElement.innerText
    );
    expect(names).toEqual([
      'COMPLIANCE.APP_USAGE',
      'COMPLIANCE.BLOOD_SAMPLES',
      'COMPLIANCE.LAB_RESULTS',
      'COMPLIANCE.NASAL_SWABS',
      'world-domination',
    ]);
  });

  function getComplianceData(): ComplianceData {
    return {
      textfields: {
        firstname: 'Michael',
        lastname: 'Myers',
        birthdate: new Date('01.01.1900'),
      },
      compliance_system: {
        app: true,
        samples: true,
        bloodsamples: false,
        labresults: false,
      },
      compliance_questionnaire: [
        { name: 'world-domination', value: true },
        { name: 'textual-domination', value: 'please what?!' },
      ],
    };
  }
});
