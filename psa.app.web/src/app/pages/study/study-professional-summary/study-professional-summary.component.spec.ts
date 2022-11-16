/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyProfessionalSummaryComponent } from './study-professional-summary.component';
import { CurrentUser } from '../../../_services/current-user.service';
import { MockDirective, MockPipe, MockProvider } from 'ng-mocks';
import { createStudy } from '../../../psa.app.core/models/instance.helper.spec';
import { MatCardHarness } from '@angular/material/card/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { StudyStatusPipe } from '../../../pipes/study-status.pipe';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { NgLetDirective } from '../../../_directives/ng-let.directive';
import { MatIconModule } from '@angular/material/icon';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { ChangeDetectionStrategy } from '@angular/core';

describe('StudyProfessionalSummaryComponent', () => {
  let component: StudyProfessionalSummaryComponent;
  let fixture: ComponentFixture<StudyProfessionalSummaryComponent>;
  let loader: HarnessLoader;

  let currentUser: SpyObj<CurrentUser>;

  beforeEach(async () => {
    currentUser = createSpyObj<CurrentUser>('CurrentUser', ['hasRole'], {
      username: 'TestForscher',
    });
    currentUser.hasRole.and.callFake((role) => role === 'Forscher');

    await TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
      ],
      declarations: [
        StudyProfessionalSummaryComponent,
        StudyStatusPipe,
        NgLetDirective,
        MockDirective(MatTooltip),
        MockDirective(CdkCopyToClipboard),
        MockPipe(TranslatePipe, (value) => value),
      ],
      providers: [MockProvider(CurrentUser, currentUser)],
    })
      // Due to a bug in Angular it is currently not possible to test this component with OnPush:
      // @see https://github.com/angular/angular/issues/12313
      .overrideComponent(StudyProfessionalSummaryComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StudyProfessionalSummaryComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show basic study information', async () => {
    // Arrange
    component.study = createStudy({
      name: 'Teststudy',
      pseudonym_prefix: 'TEST',
      accounts_count: 42,
    });

    // Act
    fixture.detectChanges();
    const card = await loader.getHarness(MatCardHarness);

    // Assert
    expect(await card.getTitleText()).toContain('Teststudy');
    expect(await card.getSubtitleText()).toContain('42  STUDY.PROBANDS');
  });

  it('should show the registration link for open studies', async () => {
    // Arrange
    component.study = createStudy({
      name: 'Teststudy',
      proband_realm_group_id: 'abc-def',
      has_open_self_registration: true,
      max_allowed_accounts_count: 1000,
      accounts_count: 42,
    });

    // Act
    fixture.detectChanges();
    const registrationLink = fixture.debugElement.query(
      By.css('[data-unit="registration-link"]')
    );

    // Assert
    expect(registrationLink).not.toBeNull();
    expect(registrationLink.nativeElement.innerText).toContain(
      '/registration/abc-def'
    );
  });

  it('should not show the registration link for closed studies', async () => {
    // Arrange
    component.study = createStudy({
      name: 'Teststudy',
      has_open_self_registration: false,
    });

    // Act
    fixture.detectChanges();
    const registrationLink = fixture.debugElement.query(
      By.css('[data-unit="registration-link"]')
    );

    // Assert
    expect(registrationLink).toBeNull();
  });

  it('should show edit buttons if user is Forscher and study is active', async () => {
    // Arrange
    component.study = createStudy({
      status: 'active',
    });

    // Act
    fixture.detectChanges();
    const matCardActions = fixture.debugElement.query(
      By.css('[data-unit="study-actions"]')
    );
    const changeStudyButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'STUDY.CHANGE' })
    );
    const editWelcomeMailButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'STUDY.EDIT_WELCOME_MAIL' })
    );
    const editWelcomeTextButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'STUDY.EDIT_WELCOME_TEXT' })
    );

    // Assert
    expect(matCardActions).not.toBeNull();
    expect(await changeStudyButton.isDisabled()).toBeFalse();
    expect(await editWelcomeMailButton.isDisabled()).toBeFalse();
    expect(await editWelcomeTextButton.isDisabled()).toBeFalse();
  });

  it('should not show edit buttons if study is deleted', async () => {
    // Arrange
    component.study = createStudy({
      status: 'deleted',
    });

    // Act
    fixture.detectChanges();
    const matCardActions = fixture.debugElement.query(
      By.css('[data-unit="study-actions"]')
    );

    // Assert
    expect(matCardActions).toBeNull();
  });

  it('should translate the study status', () => {
    // Arrange
    component.study = createStudy({
      status: 'deletion_pending',
    });

    // Act
    fixture.detectChanges();
    const studyStatus = fixture.debugElement.query(
      By.css('[data-unit="study-status"]')
    );

    // Assert
    expect(studyStatus.nativeElement.innerText).toContain(
      'STUDIES.STATUS_DELETION_PENDING'
    );
  });
});
