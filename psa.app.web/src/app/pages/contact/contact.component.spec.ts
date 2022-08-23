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
import { MockBuilder } from 'ng-mocks';

import { AppModule } from '../../app.module';
import { ComplianceManager } from '../../_services/compliance-manager.service';
import { AlertService } from '../../_services/alert.service';
import { CurrentUser } from '../../_services/current-user.service';
import { ContactComponent } from './contact.component';
import { TranslateService } from '@ngx-translate/core';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { StudyAddress } from '../../psa.app.core/models/studyAddress';
import { By } from '@angular/platform-browser';
import SpyObj = jasmine.SpyObj;

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  let user: SpyObj<CurrentUser>;
  let translate: SpyObj<TranslateService>;
  let alertService: SpyObj<AlertService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let complianceManager: SpyObj<ComplianceManager>;

  beforeEach(async () => {
    // Provider and Services
    user = jasmine.createSpyObj<CurrentUser>([], {
      study: 'Teststudy',
      username: 'Testproband',
    });
    translate = jasmine.createSpyObj<TranslateService>(['instant']);
    translate.instant.and.returnValue('no address');
    complianceManager = jasmine.createSpyObj<ComplianceManager>(
      'ComplianceManager',
      ['userHasCompliances']
    );
    complianceManager.userHasCompliances.and.resolveTo(true);
    questionnaireService = jasmine.createSpyObj<QuestionnaireService>([
      'getStudyAddresses',
    ]);
    questionnaireService.getStudyAddresses.and.resolveTo(
      createStudyAddresses()
    );
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);

    // Build Base Module
    await MockBuilder(ContactComponent, AppModule)
      .mock(CurrentUser, user)
      .mock(TranslateService, translate)
      .mock(AlertService, alertService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(ComplianceManager, complianceManager);
  });

  it('should initialize the component', fakeAsync(() => {
    questionnaireService.getStudyAddresses.and.resolveTo(
      createStudyAddresses()
    );
    createComponent();
    expect(component.hasSampleCompliance).toBeTrue();
    expect(component.addresses).toEqual(createStudyAddresses());
  }));

  it('should display text if no address was found', fakeAsync(() => {
    questionnaireService.getStudyAddresses.and.resolveTo([]);
    createComponent();
    const hint = fixture.debugElement.query(By.css('[unit-no-addresses-hint]'));
    expect(hint.nativeElement.innerHTML).toEqual('no address');
  }));

  it('should render simple HTML from address text', fakeAsync(() => {
    questionnaireService.getStudyAddresses.and.resolveTo(
      createStudyAddresses()
    );
    createComponent();
    const hint = fixture.debugElement.query(By.css('[unit-address-text]'));
    expect(hint.nativeElement.innerText).toEqual(
      'this is an address\nwith a new line'
    );
    expect(hint.query(By.css('.unit-this-should-be-rendered'))).not.toBeNull();
  }));

  it('should show an error alert if an error occured', fakeAsync(() => {
    questionnaireService.getStudyAddresses.and.rejectWith('some error');
    createComponent();
    expect(alertService.errorObject).toHaveBeenCalledTimes(1);
  }));

  function createComponent(): void {
    // Create component
    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }

  function createStudyAddresses(): StudyAddress[] {
    return [
      {
        name: 'Teststudy',
        address:
          'this is an address<br>with a new line<div class="unit-this-should-be-rendered"></div>',
      },
    ];
  }
});
